/* ==========================================================
   Utilidades compartilhadas por todas as páginas (namespace LC).
   Depende de: config.js e products.js.
   ========================================================== */
(() => {
  'use strict';

  const CFG = window.LIMA_CIEL_CONFIG || {};
  const PRODUCTS = Array.isArray(window.LIMA_CIEL_PRODUCTS) ? window.LIMA_CIEL_PRODUCTS : [];

  const CATEGORIES = [
    { name: 'Vestidos', slug: 'vestidos' },
    { name: 'Blusas', slug: 'blusas' },
    { name: 'Calças', slug: 'calcas' },
    { name: 'Saias', slug: 'saias' },
    { name: 'Conjuntos', slug: 'conjuntos' }
  ];
  const SIZE_ORDER = ['36', '38', '40', '42', '44', '46', '48', '50', '52', 'PP', 'P', 'M', 'G', 'GG', 'Único'];

  /* ---------- DOM e formatação ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = (n) => brl.format(Number(n) || 0);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const digits = (s) => String(s ?? '').replace(/\D/g, '');
  const safeColor = (hex) => (/^#[0-9a-f]{3,8}$/i.test(hex || '') ? hex : '#cccccc');

  /* Caminho relativo à raiz do site (páginas em /categorias usam data-base="../"). */
  const base = () => document.body.dataset.base || '';
  const url = (p) => base() + p;

  /* ---------- Produtos ---------- */
  const byId = (id) => PRODUCTS.find((p) => p.id === id) || null;
  const onSale = (p) => typeof p.promoPrice === 'number' && p.promoPrice > 0 && p.promoPrice < p.price;
  const unitPrice = (p) => (onSale(p) ? p.promoPrice : p.price);
  const discountPct = (p) => (onSale(p) ? Math.round((1 - p.promoPrice / p.price) * 100) : 0);
  const hasColorChoice = (p) => (p.colors || []).length > 1;
  const defaultColor = (p) => ((p.colors || [])[0] || {}).name || '';

  function stockOf(p, color, size) {
    const s = p.stock || {};
    if (color && s[color] && typeof s[color] === 'object') return Math.max(0, Number(s[color][size]) || 0);
    return Math.max(0, Number(s[size]) || 0);
  }
  function totalStock(p) {
    const colors = (p.colors || []).length ? p.colors.map((c) => c.name) : [''];
    return colors.reduce((sum, c) => sum + p.sizes.reduce((s2, size) => s2 + stockOf(p, c, size), 0), 0);
  }
  const isSoldOut = (p) => totalStock(p) === 0;
  const sortSizes = (list) => list.slice().sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  /* Fotos de uma cor (se as fotos indicarem cor); senão, todas. */
  const asset = (src) => (/^(https?:|data:|\/)/.test(src || '') ? src : url(src || ''));
  function imagesFor(p, color) {
    const all = (p.images || []).map((img) => ({ ...img, src: asset(img.src) }));
    const ofColor = color ? all.filter((img) => img.color === color) : [];
    if (ofColor.length) return ofColor;
    const neutral = all.filter((img) => !img.color);
    return neutral.length ? neutral : all;
  }
  const mainImage = (p, color) => imagesFor(p, color)[0] || { src: '', alt: p.name };
  const productUrl = (p) => url(`produto.html?id=${encodeURIComponent(p.id)}`);
  const categoryUrl = (name) => {
    const c = CATEGORIES.find((x) => x.name === name);
    return c ? url(`categorias/${c.slug}.html`) : url('produtos.html');
  };

  /* ---------- Armazenamento (falha silenciosa em navegação privada) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (_) { /* ignora */ } }
  };

  /* ---------- Aviso discreto ---------- */
  let toastTimer;
  function toast(html, { timeout = 3800 } = {}) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), timeout);
  }

  /* ---------- Backend ---------- */
  const apiRoot = () => String(CFG.apiBaseUrl || '').replace(/\/+$/, '');
  const apiAvailable = () => location.protocol !== 'file:' || /^https?:\/\//.test(apiRoot());

  async function api(path, { method = 'GET', body } = {}) {
    if (!apiAvailable()) { const e = new Error('Backend indisponível.'); e.status = 0; throw e; }
    let res;
    try {
      res = await fetch(`${apiRoot()}/api${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (_) {
      const e = new Error('Sem conexão com o servidor da loja.'); e.status = 0; throw e;
    }
    const type = res.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await res.json().catch(() => ({})) : {};
    if (!res.ok) { const e = new Error(data.error || `Erro ${res.status}`); e.status = res.status; throw e; }
    if (!type.includes('application/json')) { const e = new Error('Backend indisponível.'); e.status = 0; throw e; }
    return data;
  }

  /* Quais integrações o backend informa como ativas. Sem backend: tudo desativado. */
  let statusPromise;
  function integrations() {
    if (!statusPromise) {
      statusPromise = api('/status')
        .then((s) => ({ online: true, shipping: !!s.shipping, payments: !!s.payments, restockAlerts: !!s.restockAlerts }))
        .catch(() => ({ online: false, shipping: false, payments: false, restockAlerts: false }));
    }
    return statusPromise;
  }

  /* ---------- Contato ---------- */
  const stores = () => (CFG.stores || []).filter((s) => s && s.name);
  const waLink = (number, text) => (/^\d{12,13}$/.test(number || '') ? `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '');
  const instagramDm = () => (CFG.instagram && CFG.instagram.handle ? `https://ig.me/m/${encodeURIComponent(CFG.instagram.handle)}` : '');

  /* ---------- Documentos ---------- */
  function isValidCpf(value) {
    const cpf = digits(value);
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    const calc = (len) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
  }
  const mask = {
    cep: (v) => digits(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
    cpf: (v) => digits(v).slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2'),
    phone: (v) => {
      const d = digits(v).slice(0, 11);
      if (d.length <= 2) return d.replace(/^(\d+)/, '($1');
      if (d.length <= 6) return d.replace(/^(\d{2})(\d+)/, '($1) $2');
      if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
      return d.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
    }
  };

  window.LC = {
    CFG, PRODUCTS, CATEGORIES,
    $, $$, money, esc, norm, digits, safeColor, url, asset,
    byId, onSale, unitPrice, discountPct, hasColorChoice, defaultColor,
    stockOf, totalStock, isSoldOut, sortSizes, imagesFor, mainImage, productUrl, categoryUrl,
    store, toast, api, integrations, stores, waLink, instagramDm, isValidCpf, mask
  };
})();
