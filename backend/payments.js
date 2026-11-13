'use strict';
/*
 * Pagamentos — Mercado Pago Checkout Pro (API REST oficial, sem SDK).
 * O cliente paga na página do Mercado Pago (Pix, cartão de crédito e débito,
 * conforme o que estiver habilitado na conta). Este site nunca recebe dados de cartão.
 *
 * A confirmação do pagamento vem SOMENTE pelo webhook validado (webhooks.js).
 * O retorno do navegador (back_urls) é tratado apenas como informação visual.
 */
const env = require('./env');
const { httpError } = require('./catalog');

const API = 'https://api.mercadopago.com';

const isConfigured = () => Boolean(env.mercadoPago.accessToken && /^https?:\/\//.test(env.publicSiteUrl));

/*
 * Forma escolhida no checkout → tipos excluídos no Checkout Pro, para que a página
 * do Mercado Pago mostre só o que a cliente escolheu (Pix = bank_transfer).
 */
const ALL_TYPES = ['credit_card', 'debit_card', 'bank_transfer', 'ticket', 'atm', 'prepaid_card'];
const KEEP = { pix: ['bank_transfer'], credito: ['credit_card'], debito: ['debit_card'] };
function excludedTypesFor(method) {
  const keep = KEEP[method];
  const base = keep ? ALL_TYPES.filter((t) => !keep.includes(t)) : [];
  return [...new Set([...base, ...env.mercadoPago.excludedPaymentTypes])].filter((t) => !(keep || []).includes(t));
}

async function mpFetch(pathName, { method = 'GET', body, idempotencyKey } = {}) {
  const headers = { Authorization: `Bearer ${env.mercadoPago.accessToken}`, Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  const res = await fetch(`${API}${pathName}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[mercadopago] ${method} ${pathName} → ${res.status}`, JSON.stringify(data).slice(0, 400));
    throw httpError(502, 'Não foi possível comunicar com o Mercado Pago agora.');
  }
  return data;
}

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  return { name: parts.shift() || '', surname: parts.join(' ') };
}

function splitPhone(phone) {
  const d = String(phone).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return { area_code: d.slice(0, 2), number: d.slice(2) };
}

async function createPreference(order) {
  if (!isConfigured()) throw httpError(503, 'Pagamento online ainda não configurado pela loja.');
  const site = env.publicSiteUrl;
  const back = (status) => `${site}/pedido.html?pedido=${encodeURIComponent(order.id)}&retorno=${status}`;
  const { customer, delivery } = order;

  const body = {
    external_reference: order.id,
    items: order.items.map((i) => ({
      id: i.id,
      title: [i.name, i.color, `Tam. ${i.size}`].filter(Boolean).join(' · ').slice(0, 250),
      quantity: i.qty,
      unit_price: i.unitPrice,
      currency_id: 'BRL',
      category_id: 'fashion'
    })),
    payer: {
      ...splitName(customer.name),
      email: customer.email,
      phone: splitPhone(customer.phone),
      ...(customer.cpf ? { identification: { type: 'CPF', number: customer.cpf } } : {})
    },
    back_urls: { success: back('sucesso'), pending: back('pendente'), failure: back('falha') },
    statement_descriptor: env.mercadoPago.statementDescriptor,
    payment_methods: {
      excluded_payment_types: excludedTypesFor(order.paymentMethod).map((id) => ({ id })),
      ...(order.paymentMethod === 'credito' && env.mercadoPago.maxInstallments ? { installments: env.mercadoPago.maxInstallments } : {}),
      ...(order.paymentMethod === 'pix' || order.paymentMethod === 'debito' ? { installments: 1 } : {})
    },
    metadata: { order_id: order.id }
  };

  /* O Mercado Pago só aceita auto_return e webhook com endereços públicos em HTTPS. */
  if (site.startsWith('https://')) body.auto_return = 'approved';
  if (env.publicApiUrl.startsWith('https://')) body.notification_url = `${env.publicApiUrl}/api/webhooks/mercadopago`;

  if (delivery.method === 'entrega') {
    body.shipments = {
      mode: 'not_specified',
      cost: order.totals.shipping,
      receiver_address: {
        zip_code: delivery.address.cep,
        street_name: delivery.address.street,
        street_number: delivery.address.number,
        apartment: delivery.address.complement || undefined,
        city_name: delivery.address.city,
        state_name: delivery.address.state
      }
    };
  }

  const pref = await mpFetch('/checkout/preferences', { method: 'POST', body, idempotencyKey: order.id });
  const sandbox = env.mercadoPago.accessToken.startsWith('TEST-');
  const url = (sandbox && pref.sandbox_init_point) || pref.init_point;
  if (!url) throw httpError(502, 'O Mercado Pago não devolveu o link de pagamento.');
  return { preferenceId: pref.id, checkoutUrl: url };
}

const getPayment = (paymentId) => mpFetch(`/v1/payments/${encodeURIComponent(paymentId)}`);

/* Status do Mercado Pago → status do pedido na loja. */
function orderStatusFor(mpStatus) {
  switch (mpStatus) {
    case 'approved': return 'pago';
    case 'pending':
    case 'in_process':
    case 'authorized': return 'pagamento_em_analise';
    case 'rejected': return 'pagamento_recusado';
    case 'cancelled': return 'cancelado';
    case 'refunded':
    case 'charged_back': return 'estornado';
    default: return null;
  }
}

module.exports = { isConfigured, createPreference, getPayment, orderStatusFor, excludedTypesFor };
