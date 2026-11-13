'use strict';
/*
 * Webhook do Mercado Pago — única fonte de confirmação de pagamento.
 *
 * 1. Valida a assinatura (cabeçalho x-signature, HMAC-SHA256 com MP_WEBHOOK_SECRET).
 * 2. Busca o pagamento na API do Mercado Pago (nunca confia no corpo da notificação).
 * 3. Confere valor e moeda com o pedido salvo e atualiza o status.
 *
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
const crypto = require('node:crypto');
const env = require('./env');
const payments = require('./payments');
const orders = require('./orders');

function parseSignature(header) {
  const out = {};
  for (const part of String(header || '').split(',')) {
    const [k, v] = part.split('=').map((s) => (s || '').trim());
    if (k && v) out[k] = v;
  }
  return out;
}

function isValidSignature({ dataId, signatureHeader, requestId }) {
  const secret = env.mercadoPago.webhookSecret;
  if (!secret) return false;
  const { ts, v1 } = parseSignature(signatureHeader);
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;

  /* O manifesto omite os campos ausentes; IDs alfanuméricos são usados em minúsculas. */
  let manifest = '';
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1.toLowerCase(), 'hex'));
}

/**
 * @returns {Promise<{status:number, body:object}>}
 */
async function handleMercadoPago({ query, headers, body }) {
  if (!env.mercadoPago.webhookSecret || !env.mercadoPago.accessToken) {
    return { status: 503, body: { error: 'Webhook não configurado.' } };
  }

  const dataId = String(query.get('data.id') || (body && body.data && body.data.id) || '');
  const type = String(query.get('type') || query.get('topic') || (body && body.type) || '');

  if (!isValidSignature({ dataId: query.get('data.id') || dataId, signatureHeader: headers['x-signature'], requestId: headers['x-request-id'] })) {
    console.warn('[webhook] assinatura inválida — notificação ignorada');
    return { status: 401, body: { error: 'Assinatura inválida.' } };
  }

  if (type !== 'payment' || !dataId) return { status: 200, body: { ignored: true } };

  const payment = await payments.getPayment(dataId);
  const orderId = String(payment.external_reference || '');
  const order = orders.getOrder(orderId);
  if (!order) {
    console.warn('[webhook] pagamento sem pedido correspondente:', dataId, orderId);
    return { status: 200, body: { ignored: true } };
  }

  const amountOk = payment.currency_id === 'BRL' && Math.abs(Number(payment.transaction_amount) - order.totals.total) < 0.01;
  let newStatus = payments.orderStatusFor(payment.status);
  if (newStatus === 'pago' && !amountOk) {
    newStatus = 'divergencia_de_valor';
    console.error(`[webhook] valor divergente no pedido ${order.id}: pago ${payment.transaction_amount}, esperado ${order.totals.total}`);
  }

  await orders.updateOrder(order.id, (o) => {
    const entry = {
      id: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail,
      method: payment.payment_method_id,
      type: payment.payment_type_id,
      amount: payment.transaction_amount,
      approvedAt: payment.date_approved || null,
      receivedAt: new Date().toISOString()
    };
    o.payments = (o.payments || []).filter((p) => p.id !== entry.id).concat(entry);
    /* Um pedido já pago só muda se houver estorno. */
    if (newStatus && (o.status !== 'pago' || newStatus === 'estornado')) o.status = newStatus;
  });

  console.log(`[webhook] pedido ${order.id}: pagamento ${payment.id} → ${payment.status}`);
  return { status: 200, body: { received: true } };
}

module.exports = { handleMercadoPago, isValidSignature };
