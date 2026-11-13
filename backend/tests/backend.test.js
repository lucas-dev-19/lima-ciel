'use strict';
/* Testes do backend: node --test "backend/tests/*.test.js"  (sem dependências) */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');

process.env.MP_WEBHOOK_SECRET = 'segredo-de-teste';
process.env.MP_ACCESS_TOKEN = '';
process.env.ME_TOKEN = '';
process.env.DATA_DIR = path.join(os.tmpdir(), `limaciel-test-${process.pid}`);

const { isValidSignature } = require('../webhooks');
const { isValidCpf, server } = require('../server');
const catalog = require('../catalog');
const shipping = require('../shipping');

const sign = (manifest, secret = 'segredo-de-teste') => crypto.createHmac('sha256', secret).update(manifest).digest('hex');

test('webhook: aceita assinatura correta do Mercado Pago', () => {
  const v1 = sign('id:123456;request-id:abc-1;ts:1704908010;');
  assert.strictEqual(isValidSignature({ dataId: '123456', requestId: 'abc-1', signatureHeader: `ts=1704908010,v1=${v1}` }), true);
});

test('webhook: ID alfanumérico é comparado em minúsculas', () => {
  const v1 = sign('id:abc123;request-id:r;ts:1;');
  assert.strictEqual(isValidSignature({ dataId: 'ABC123', requestId: 'r', signatureHeader: `ts=1,v1=${v1}` }), true);
});

test('webhook: recusa assinatura com segredo errado, adulterada ou ausente', () => {
  const wrong = sign('id:123456;request-id:abc-1;ts:1704908010;', 'outro');
  assert.strictEqual(isValidSignature({ dataId: '123456', requestId: 'abc-1', signatureHeader: `ts=1704908010,v1=${wrong}` }), false);
  const ok = sign('id:123456;request-id:abc-1;ts:1704908010;');
  assert.strictEqual(isValidSignature({ dataId: '999999', requestId: 'abc-1', signatureHeader: `ts=1704908010,v1=${ok}` }), false);
  assert.strictEqual(isValidSignature({ dataId: '123456', requestId: 'abc-1', signatureHeader: '' }), false);
});

test('pagamento: a forma escolhida limita o Checkout Pro a ela', () => {
  const { excludedTypesFor } = require('../payments');
  assert.ok(!excludedTypesFor('pix').includes('bank_transfer'));
  assert.ok(excludedTypesFor('pix').includes('credit_card') && excludedTypesFor('pix').includes('debit_card'));
  assert.ok(!excludedTypesFor('credito').includes('credit_card') && excludedTypesFor('credito').includes('bank_transfer'));
  assert.ok(!excludedTypesFor('debito').includes('debit_card') && excludedTypesFor('debito').includes('credit_card'));
});

test('CPF: valida dígitos verificadores', () => {
  assert.strictEqual(isValidCpf('52998224725'), true);
  assert.strictEqual(isValidCpf('52998224724'), false);
  assert.strictEqual(isValidCpf('11111111111'), false);
});

test('catálogo: recusa produto esgotado, tamanho inválido e quantidade acima do estoque', () => {
  const products = catalog.getProducts();
  const soldOut = products.find((p) => p.sizes.every((s) => catalog.stockOf(p, (p.colors[0] || {}).name, s) === 0));
  assert.ok(soldOut, 'deve existir um produto de exemplo esgotado');
  assert.throws(() => catalog.resolveItems([{ id: soldOut.id, color: soldOut.colors[0].name, size: soldOut.sizes[0], qty: 1 }]), /esgotado/);

  const ok = products.find((p) => p.sizes.some((s) => catalog.stockOf(p, p.colors[0].name, s) > 0));
  const size = ok.sizes.find((s) => catalog.stockOf(ok, ok.colors[0].name, s) > 0);
  assert.throws(() => catalog.resolveItems([{ id: ok.id, color: ok.colors[0].name, size: 'XYZ', qty: 1 }]), /Tamanho inválido/);
  assert.throws(() => catalog.resolveItems([{ id: ok.id, color: ok.colors[0].name, size, qty: 999 }]), /Quantidade inválida|Só há/);

  const [line] = catalog.resolveItems([{ id: ok.id, color: ok.colors[0].name, size, qty: 1, unitPrice: 0.01 }]);
  assert.strictEqual(line.unitPrice, catalog.unitPrice(ok), 'o preço vem do catálogo, não do navegador');
});

test('frete: sem credenciais, a cotação é recusada (sem valor inventado)', async () => {
  assert.strictEqual(shipping.isConfigured(), false);
  await assert.rejects(shipping.quote('20040002', []), (err) => err.status === 503);
});

test('API: status, checkout sem configuração e webhook sem assinatura', async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const status = await (await fetch(`${base}/api/status`)).json();
    assert.deepStrictEqual({ shipping: status.shipping, payments: status.payments }, { shipping: false, payments: false });

    const checkout = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(checkout.status, 503);

    const hook = await fetch(`${base}/api/webhooks/mercadopago?data.id=1&type=payment`, { method: 'POST', body: '{}' });
    assert.notStrictEqual(hook.status, 200, 'webhook sem assinatura válida nunca é aceito');

    const quote = await fetch(`${base}/api/shipping/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cep: '20040002', items: [] }) });
    assert.strictEqual(quote.status, 503);

    const traversal = await fetch(`${base}/backend/.env.example`);
    assert.strictEqual(traversal.status, 404, 'arquivos do backend não são servidos');
  } finally {
    server.close();
  }
});
