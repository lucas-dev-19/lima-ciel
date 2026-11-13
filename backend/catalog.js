'use strict';
/*
 * Catálogo no servidor.
 * Reaproveita js/products.js e js/config.js (fonte única de dados), mas o servidor
 * é quem decide preço, disponibilidade e peso: nada disso é aceito vindo do navegador.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const cache = new Map();

function loadBrowserData(relPath, globalName) {
  const file = path.join(ROOT, relPath);
  const { mtimeMs } = fs.statSync(file);
  const hit = cache.get(file);
  if (hit && hit.mtimeMs === mtimeMs) return hit.value;

  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: relPath, timeout: 1000 });
  const value = sandbox.window[globalName];
  cache.set(file, { mtimeMs, value });
  return value;
}

const getProducts = () => loadBrowserData('js/products.js', 'LIMA_CIEL_PRODUCTS') || [];
const getStoreConfig = () => loadBrowserData('js/config.js', 'LIMA_CIEL_CONFIG') || {};
const getProduct = (id) => getProducts().find((p) => p.id === id) || null;

const unitPrice = (p) => (typeof p.promoPrice === 'number' && p.promoPrice > 0 && p.promoPrice < p.price ? p.promoPrice : p.price);

function stockOf(p, color, size) {
  const s = p.stock || {};
  if (color && s[color] && typeof s[color] === 'object') return Math.max(0, Number(s[color][size]) || 0);
  return Math.max(0, Number(s[size]) || 0);
}

/*
 * Valida itens enviados pelo navegador ({ id, color, size, qty }) e devolve
 * linhas com preço e dados oficiais do catálogo. Lança erro legível se algo não confere.
 */
function resolveItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw httpError(400, 'O pedido está vazio.');
  if (rawItems.length > 30) throw httpError(400, 'Pedido com itens demais.');
  const cfg = getStoreConfig();
  const maxQty = Number(cfg.maxQtyPerItem) || 10;

  return rawItems.map((raw) => {
    const p = getProduct(String(raw && raw.id));
    if (!p) throw httpError(400, 'Um dos produtos não existe mais no catálogo.');
    const colorNames = (p.colors || []).map((c) => c.name);
    const color = colorNames.length ? String(raw.color || '') : '';
    if (colorNames.length && !colorNames.includes(color)) throw httpError(400, `Cor inválida para ${p.name}.`);
    const size = String(raw.size || '');
    if (!(p.sizes || []).includes(size)) throw httpError(400, `Tamanho inválido para ${p.name}.`);
    const qty = Number.parseInt(raw.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQty) throw httpError(400, `Quantidade inválida para ${p.name}.`);
    const available = stockOf(p, color, size);
    if (available < qty) {
      throw httpError(409, available === 0
        ? `${p.name} (${size}) está esgotado.`
        : `Só há ${available} unidade(s) de ${p.name} (${size}).`);
    }
    return {
      id: p.id,
      name: p.name,
      color,
      size,
      qty,
      unitPrice: unitPrice(p),
      demo: Boolean(p.demo),
      weightKg: Number(p.weightKg) || null
    };
  });
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

const round2 = (n) => Math.round(n * 100) / 100;

module.exports = { getProducts, getProduct, getStoreConfig, unitPrice, stockOf, resolveItems, httpError, round2 };
