'use strict';
/*
 * Lima Ciel — backend (Node.js puro, sem dependências).
 *
 *   node backend/server.js        → API em http://localhost:3000/api
 *                                    e o site em http://localhost:3000 (SERVE_STATIC=true)
 *
 * Rotas:
 *   GET  /api/status                       quais integrações estão ativas (sem segredos)
 *   POST /api/shipping/quote               cotação de frete real (Melhor Envio)
 *   POST /api/checkout                     cria pedido + preferência do Mercado Pago
 *   GET  /api/orders/:id?key=...           status do pedido (para a página de retorno)
 *   POST /api/webhooks/mercadopago         confirmação de pagamento (assinatura validada)
 *   POST /api/restock-alerts               "Avise-me quando voltar" (com consentimento)
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const env = require('./env');
const catalog = require('./catalog');
const shipping = require('./shipping');
const payments = require('./payments');
const webhooks = require('./webhooks');
const orders = require('./orders');

const ROOT = path.resolve(__dirname, '..');
const MAX_BODY = 64 * 1024;

/* ---------- utilidades HTTP ---------- */
function send(res, status, body, extraHeaders = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(json);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(catalog.httpError(413, 'Requisição grande demais.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (_) { reject(catalog.httpError(400, 'JSON inválido.')); }
    });
    req.on('error', reject);
  });
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !env.allowedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin'
  };
}

/* Limite simples por IP (memória) para rotas públicas que chamam serviços externos. */
const hits = new Map();
function rateLimited(req, bucket, max, windowMs = 60_000) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = `${bucket}|${ip}`;
  const now = Date.now();
  const entry = hits.get(key) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count += 1;
  hits.set(key, entry);
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  return entry.count > max;
}

/* ---------- validação dos dados do cliente ---------- */
const clean = (v, max = 120) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '');

function isValidCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function validateCustomer(raw = {}, requireCpf) {
  const c = {
    name: clean(raw.name, 120),
    email: clean(raw.email, 160).toLowerCase(),
    phone: digitsOnly(raw.phone).slice(0, 13),
    cpf: digitsOnly(raw.cpf)
  };
  if (c.name.split(/\s+/).length < 2) throw catalog.httpError(400, 'Informe nome e sobrenome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) throw catalog.httpError(400, 'E-mail inválido.');
  if (!/^\d{10,13}$/.test(c.phone)) throw catalog.httpError(400, 'Telefone inválido.');
  if ((requireCpf || c.cpf) && !isValidCpf(c.cpf)) throw catalog.httpError(400, 'CPF inválido.');
  return c;
}

function validateAddress(raw = {}) {
  const a = {
    cep: digitsOnly(raw.cep),
    street: clean(raw.street, 160),
    number: clean(raw.number, 20),
    complement: clean(raw.complement, 80),
    district: clean(raw.district, 80),
    city: clean(raw.city, 80),
    state: clean(raw.state, 2).toUpperCase()
  };
  if (!/^\d{8}$/.test(a.cep)) throw catalog.httpError(400, 'CEP inválido.');
  for (const k of ['street', 'number', 'district', 'city']) if (!a[k]) throw catalog.httpError(400, 'Endereço incompleto.');
  if (!/^[A-Z]{2}$/.test(a.state)) throw catalog.httpError(400, 'Estado inválido.');
  return a;
}

/* ---------- rotas da API ---------- */
async function handleApi(req, res, url) {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const reply = (status, body) => send(res, status, body, cors);
  const route = `${req.method} ${url.pathname.replace(/\/+$/, '')}`;

  if (route === 'GET /api/status') {
    return reply(200, {
      shipping: shipping.isConfigured(),
      payments: payments.isConfigured(),
      webhook: Boolean(env.mercadoPago.webhookSecret && env.publicApiUrl.startsWith('https://')),
      restockAlerts: true
    });
  }

  if (route === 'POST /api/shipping/quote') {
    if (rateLimited(req, 'quote', 30)) return reply(429, { error: 'Muitas consultas. Aguarde um minuto.' });
    const body = await readJson(req);
    const { options } = await shipping.quote(body.cep, body.items);
    return reply(200, { options, source: 'melhorenvio' });
  }

  if (route === 'POST /api/checkout') {
    if (rateLimited(req, 'checkout', 10)) return reply(429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    if (!payments.isConfigured()) return reply(503, { error: 'Pagamento online ainda não configurado pela loja.' });
    const body = await readJson(req);
    const cfg = catalog.getStoreConfig();
    const method = body.delivery && body.delivery.method;
    if (method !== 'entrega' && method !== 'retirada') throw catalog.httpError(400, 'Escolha entrega ou retirada.');
    const pickupStore = method === 'retirada'
      ? (cfg.stores || []).find((s) => s.pickup && s.id === String(body.delivery.storeId || ''))
      : null;
    if (method === 'retirada' && !pickupStore) throw catalog.httpError(400, 'Escolha uma loja válida para retirada.');

    const customer = validateCustomer(body.customer, Boolean(cfg.checkout && cfg.checkout.requireCpf));
    const items = catalog.resolveItems(body.items);
    const subtotal = catalog.round2(items.reduce((s, i) => s + i.unitPrice * i.qty, 0));

    let delivery = { method: 'retirada', store: pickupStore && { id: pickupStore.id, name: pickupStore.name, address: pickupStore.address } };
    let shippingCost = 0;
    if (method === 'entrega') {
      const address = validateAddress(body.delivery.address);
      /* O frete é cotado de novo aqui: o valor enviado pelo navegador nunca é usado. */
      const { options } = await shipping.quote(address.cep, body.items);
      const chosen = options.find((o) => o.id === String(body.delivery.serviceId));
      if (!chosen) throw catalog.httpError(409, 'A opção de frete escolhida não está mais disponível. Cote novamente.');
      shippingCost = chosen.price;
      delivery = { method: 'entrega', address, service: chosen };
    }

    const paymentMethod = ['pix', 'credito', 'debito'].includes(body.paymentMethod) ? body.paymentMethod : '';
    if (!paymentMethod) throw catalog.httpError(400, 'Escolha a forma de pagamento.');

    const order = await orders.createOrder({
      paymentMethod,
      customer,
      items,
      delivery,
      totals: { subtotal, shipping: shippingCost, discount: 0, total: catalog.round2(subtotal + shippingCost) },
      source: body.source === 'comprar-agora' ? 'comprar-agora' : 'carrinho'
    });

    try {
      const pref = await payments.createPreference(order);
      await orders.updateOrder(order.id, (o) => { o.preferenceId = pref.preferenceId; });
      return reply(201, { orderId: order.id, accessKey: order.accessKey, checkoutUrl: pref.checkoutUrl });
    } catch (err) {
      await orders.updateOrder(order.id, (o) => { o.status = 'falha_ao_iniciar_pagamento'; });
      throw err;
    }
  }

  const orderMatch = url.pathname.match(/^\/api\/orders\/([A-Z0-9-]{6,40})$/);
  if (req.method === 'GET' && orderMatch) {
    const order = orders.getOrder(orderMatch[1]);
    const key = url.searchParams.get('key') || '';
    if (!order || key.length < 10 || key !== order.accessKey) return reply(404, { error: 'Pedido não encontrado.' });
    return reply(200, orders.publicView(order));
  }

  if (route === 'POST /api/webhooks/mercadopago') {
    const body = await readJson(req).catch(() => ({}));
    const out = await webhooks.handleMercadoPago({ query: url.searchParams, headers: req.headers, body });
    return send(res, out.status, out.body);
  }

  if (route === 'POST /api/restock-alerts') {
    if (rateLimited(req, 'restock', 8)) return reply(429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const body = await readJson(req);
    if (body.consent !== true) throw catalog.httpError(400, 'É preciso autorizar o contato para registrar o aviso.');
    const product = catalog.getProduct(String(body.productId || ''));
    if (!product) throw catalog.httpError(400, 'Produto não encontrado.');
    const email = clean(body.email, 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw catalog.httpError(400, 'E-mail inválido.');
    const size = product.sizes.includes(body.size) ? body.size : '';
    await orders.addRestockAlert({
      productId: product.id,
      size,
      email,
      consent: { given: true, text: clean(body.consentText, 300), at: new Date().toISOString() }
    });
    return reply(201, { ok: true });
  }

  return reply(404, { error: 'Rota não encontrada.' });
}

/* ---------- arquivos estáticos (desenvolvimento local) ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};
const BLOCKED = /^\/(backend|node_modules|lima-ciel)(\/|$)|\/\./;

function serveStatic(req, res, url) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (_) { return send(res, 400, { error: 'URL inválida.' }); }
  if (BLOCKED.test(pathname)) return send(res, 404, { error: 'Não encontrado.' });
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT + path.sep)) return send(res, 404, { error: 'Não encontrado.' });

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      const notFound = path.join(ROOT, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(notFound).on('error', () => res.end('Página não encontrada')).pipe(res);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (env.serveStatic && (req.method === 'GET' || req.method === 'HEAD')) return serveStatic(req, res, url);
    send(res, 404, { error: 'Não encontrado.' });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500 && !err.expose) console.error('[erro]', err);
    if (!res.headersSent) send(res, status, { error: err.expose ? err.message : 'Erro interno.' }, corsHeaders(req));
  }
});

if (require.main === module) {
  server.listen(env.port, () => {
    console.log(`Lima Ciel — backend em http://localhost:${env.port}`);
    console.log(`  Frete (Melhor Envio): ${shipping.isConfigured() ? 'configurado' : 'NÃO configurado'}`);
    console.log(`  Pagamento (Mercado Pago): ${payments.isConfigured() ? 'configurado' : 'NÃO configurado'}`);
    console.log(`  Webhook: ${env.mercadoPago.webhookSecret ? 'segredo definido' : 'SEM segredo — notificações serão recusadas'}`);
  });
}

module.exports = { server, isValidCpf };
