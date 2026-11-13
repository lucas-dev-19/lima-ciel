/* ==========================================================
   Carrinho (localStorage) e "Comprar agora".
   - O carrinho guarda só { id, color, size, qty }; preço e nome vêm sempre do catálogo.
   - "Comprar agora" usa um pedido separado e NÃO altera o carrinho.
   Depende de: utils.js
   ========================================================== */
(() => {
  'use strict';
  const { CFG, byId, stockOf, unitPrice, store } = window.LC;

  const CART_KEY = 'limaciel.cart.v2';
  const BUY_NOW_KEY = 'limaciel.buynow.v1';
  const MAX_QTY = Number(CFG.maxQtyPerItem) || 10;
  const listeners = new Set();

  const keyOf = (i) => `${i.id}|${i.color}|${i.size}`;
  const maxFor = (p, color, size) => Math.min(MAX_QTY, stockOf(p, color, size));

  /* Descarta itens que não existem mais no catálogo ou com variação inválida. */
  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Map();
    for (const raw of list) {
      const p = raw && byId(raw.id);
      if (!p || !p.sizes.includes(raw.size)) continue;
      const colors = (p.colors || []).map((c) => c.name);
      const color = colors.length ? (colors.includes(raw.color) ? raw.color : null) : '';
      if (color === null) continue;
      const qty = Math.min(MAX_QTY, Math.max(1, Number.parseInt(raw.qty, 10) || 1));
      const item = { id: p.id, color, size: raw.size, qty };
      const k = keyOf(item);
      if (seen.has(k)) seen.get(k).qty = Math.min(MAX_QTY, seen.get(k).qty + qty); else seen.set(k, item);
    }
    return [...seen.values()];
  }

  let items = sanitize(store.get(CART_KEY, []));

  function commit() {
    store.set(CART_KEY, items);
    listeners.forEach((fn) => fn(items));
  }

  /* Sincroniza abas abertas ao mesmo tempo. */
  window.addEventListener('storage', (e) => {
    if (e.key !== CART_KEY) return;
    items = sanitize(store.get(CART_KEY, []));
    listeners.forEach((fn) => fn(items));
  });

  const cart = {
    keyOf,
    items: () => items.map((i) => ({ ...i })),
    count: () => items.reduce((s, i) => s + i.qty, 0),
    subtotal: () => items.reduce((s, i) => s + unitPrice(byId(i.id)) * i.qty, 0),
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /* Itens indisponíveis (esgotados ou acima do estoque) não seguem para o pagamento. */
    problems() {
      return items.map((i) => {
        const p = byId(i.id);
        const available = stockOf(p, i.color, i.size);
        if (available === 0) return { key: keyOf(i), type: 'esgotado' };
        if (i.qty > available) return { key: keyOf(i), type: 'estoque', available };
        return null;
      }).filter(Boolean);
    },

    /** @returns {{ok:boolean, qty?:number, reason?:string}} */
    add({ id, color, size, qty = 1 }) {
      const p = byId(id);
      if (!p) return { ok: false, reason: 'Produto não encontrado.' };
      const max = maxFor(p, color, size);
      if (max === 0) return { ok: false, reason: 'Este tamanho está esgotado.' };
      const found = items.find((i) => keyOf(i) === keyOf({ id, color, size }));
      const current = found ? found.qty : 0;
      if (current >= max) return { ok: false, reason: `Você já tem a quantidade máxima disponível (${max}) no carrinho.` };
      const next = Math.min(max, current + qty);
      if (found) found.qty = next; else items.push({ id, color, size, qty: next });
      commit();
      return { ok: true, qty: next, limited: next < current + qty };
    },

    setQty(key, qty) {
      const item = items.find((i) => keyOf(i) === key);
      if (!item) return;
      const p = byId(item.id);
      const max = Math.max(1, maxFor(p, item.color, item.size));
      item.qty = Math.min(max, Math.max(1, Number.parseInt(qty, 10) || 1));
      commit();
    },

    remove(key) {
      items = items.filter((i) => keyOf(i) !== key);
      commit();
    },

    clear() { items = []; commit(); }
  };

  const buyNow = {
    set(item) { store.set(BUY_NOW_KEY, { item, createdAt: Date.now() }); },
    /* Vale por 2 horas; depois disso a pessoa volta ao produto. */
    get() {
      const data = store.get(BUY_NOW_KEY, null);
      if (!data || Date.now() - data.createdAt > 2 * 60 * 60 * 1000) return null;
      const [item] = sanitize([data.item]);
      return item || null;
    },
    clear() { store.remove(BUY_NOW_KEY); }
  };

  window.LC.cart = cart;
  window.LC.buyNow = buyNow;
  window.LC.MAX_QTY = MAX_QTY;
})();
