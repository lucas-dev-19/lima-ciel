/* ==========================================================
   Catálogo: produtos.html e páginas de categoria.
   Barra lateral de filtros (gaveta no celular): categorias, novidades,
   promoções, tamanhos, faixa de preço, disponibilidade e ordenação;
   pesquisa; paginação. O estado fica na URL (links compartilháveis).
   Páginas de categoria definem no <body>:
     data-preset-category="Vestidos"   ou   data-preset="novidades|promocoes"
   Depende de: utils.js, cart.js, main.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { $, $$, esc, norm, money, PRODUCTS, CATEGORIES } = LC;
  const root = $('#catalog-root');
  if (!root) return;

  const PAGE_SIZE = 9;
  const presetCategory = document.body.dataset.presetCategory || '';
  const preset = document.body.dataset.preset || '';
  const basePool = PRODUCTS.filter((p) => {
    if (presetCategory && p.category !== presetCategory) return false;
    if (preset === 'novidades' && !p.isNew) return false;
    if (preset === 'promocoes' && !LC.onSale(p)) return false;
    return true;
  });

  const allSizes = LC.sortSizes([...new Set(basePool.flatMap((p) => p.sizes))]);
  const categoriesInPool = CATEGORIES.filter((c) => basePool.some((p) => p.category === c.name));
  const prices = basePool.map(LC.unitPrice);
  const STEP = 10;
  const priceFloor = prices.length ? Math.floor(Math.min(...prices) / STEP) * STEP : 0;
  const priceCeil = prices.length ? Math.ceil(Math.max(...prices) / STEP) * STEP : 0;
  const COLLECTIONS = window.LIMA_CIEL_COLLECTIONS || [];
  const collectionName = (slug) => (COLLECTIONS.find((c) => c.slug === slug) || {}).name || '';

  /* ---------- Estado <-> URL ---------- */
  const params = new URLSearchParams(location.search);
  const listParam = (k) => (params.get(k) || '').split(',').map((s) => s.trim()).filter(Boolean);
  const numParam = (k) => { const n = Number(params.get(k)); return params.get(k) && Number.isFinite(n) && n >= 0 ? n : null; };
  const slugToName = (slug) => (CATEGORIES.find((c) => c.slug === slug) || {}).name;

  const state = {
    collection: collectionName(params.get('colecao')) ? params.get('colecao') : '',
    query: params.get('busca') || '',
    cats: new Set(presetCategory ? [] : listParam('categoria').map(slugToName).filter(Boolean)),
    sizes: new Set(listParam('tamanho').filter((s) => allSizes.includes(s))),
    min: numParam('min'),
    max: numParam('max'),
    isNew: params.get('novidades') === '1' && preset !== 'novidades',
    promo: params.get('promo') === '1' && preset !== 'promocoes',
    available: params.get('disponiveis') === '1',
    sort: ['relevancia', 'menor-preco', 'maior-preco', 'novidades'].includes(params.get('ordem')) ? params.get('ordem') : 'relevancia',
    page: Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1)
  };

  function syncUrl() {
    const q = new URLSearchParams();
    if (state.collection) q.set('colecao', state.collection);
    if (state.query.trim()) q.set('busca', state.query.trim());
    if (state.cats.size) q.set('categoria', [...state.cats].map((n) => CATEGORIES.find((c) => c.name === n).slug).join(','));
    if (state.sizes.size) q.set('tamanho', [...state.sizes].join(','));
    if (state.min !== null) q.set('min', state.min);
    if (state.max !== null) q.set('max', state.max);
    if (state.isNew) q.set('novidades', '1');
    if (state.promo) q.set('promo', '1');
    if (state.available) q.set('disponiveis', '1');
    if (state.sort !== 'relevancia') q.set('ordem', state.sort);
    if (state.page > 1) q.set('pagina', state.page);
    const qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : ''));
  }

  /* ---------- Filtragem ---------- */
  function results() {
    const words = norm(state.query.trim()).split(/\s+/).filter(Boolean);
    const list = basePool.filter((p) => {
      if (state.collection && p.collection !== state.collection) return false;
      if (state.cats.size && !state.cats.has(p.category)) return false;
      if (state.sizes.size && !p.sizes.some((s) => state.sizes.has(s))) return false;
      const price = LC.unitPrice(p);
      if (state.min !== null && price < state.min) return false;
      if (state.max !== null && price > state.max) return false;
      if (state.isNew && !p.isNew) return false;
      if (state.promo && !LC.onSale(p)) return false;
      if (state.available && LC.isSoldOut(p)) return false;
      if (words.length) {
        const hay = norm([p.name, p.category, p.description, (p.colors || []).map((c) => c.name).join(' '), (p.tags || []).join(' ')].join(' '));
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const soldLast = (a, b) => Number(LC.isSoldOut(a)) - Number(LC.isSoldOut(b));
    const sorters = {
      relevancia: (a, b) => soldLast(a, b) || Number(!!b.featured) - Number(!!a.featured) || Number(!!b.isNew) - Number(!!a.isNew),
      'menor-preco': (a, b) => LC.unitPrice(a) - LC.unitPrice(b),
      'maior-preco': (a, b) => LC.unitPrice(b) - LC.unitPrice(a),
      novidades: (a, b) => soldLast(a, b) || Number(!!b.isNew) - Number(!!a.isNew)
    };
    return list.sort(sorters[state.sort]);
  }

  /* ---------- Estrutura ---------- */
  const headSearch = $('#catalog-search');
  const checkbox = (name, value, label, checked, count) =>
    `<label class="check"><input type="checkbox" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}><span>${esc(label)}</span>${count !== undefined ? `<small>${count}</small>` : ''}</label>`;

  root.innerHTML = `
    <div class="catalog">
      <aside class="filters" id="filters" aria-label="Filtros">
        <div class="filters__head">
          <h2>Filtros</h2>
          <button class="icon-btn filters__close" type="button" data-close-filters aria-label="Fechar filtros">${LC.ICON.close}</button>
        </div>
        <div class="filters__body">
          ${headSearch ? '' : `
          <div class="filter-block">
            <label class="filter-title" for="f-search">Pesquisar</label>
            <div class="input-icon">${LC.ICON.search}<input class="input" id="f-search" type="search" placeholder="Buscar produtos…" autocomplete="off" value="${esc(state.query)}"></div>
          </div>`}
          ${!presetCategory ? `
          <fieldset class="filter-block">
            <legend class="filter-title">Categorias</legend>
            <div class="check-list">
              ${categoriesInPool.map((c) => checkbox('cat', c.name, c.name, state.cats.has(c.name), basePool.filter((p) => p.category === c.name).length)).join('')}
              ${preset !== 'novidades' ? checkbox('flag', 'isNew', 'Novidades', state.isNew) : ''}
              ${preset !== 'promocoes' ? checkbox('flag', 'promo', 'Promoções', state.promo) : ''}
            </div>
          </fieldset>` : ''}
          ${allSizes.length ? `
          <fieldset class="filter-block">
            <legend class="filter-title">Tamanhos</legend>
            <div class="check-list">${allSizes.map((s) => checkbox('size', s, s, state.sizes.has(s))).join('')}</div>
          </fieldset>` : ''}
          ${priceCeil > priceFloor ? `
          <fieldset class="filter-block">
            <legend class="filter-title">Faixa de preço</legend>
            <div class="range">
              <span class="range__track"></span><span class="range__fill" id="range-fill"></span>
              <input type="range" id="f-min" min="${priceFloor}" max="${priceCeil}" step="${STEP}" value="${state.min ?? priceFloor}" aria-label="Preço mínimo">
              <input type="range" id="f-max" min="${priceFloor}" max="${priceCeil}" step="${STEP}" value="${state.max ?? priceCeil}" aria-label="Preço máximo">
            </div>
            <p class="range-values"><span id="range-min"></span><span id="range-max"></span></p>
          </fieldset>` : ''}
          <fieldset class="filter-block">
            <legend class="filter-title">Disponibilidade</legend>
            <div class="check-list">${checkbox('flag', 'available', 'Somente disponíveis', state.available)}</div>
          </fieldset>
          <div class="filter-block">
            <label class="filter-title" for="f-sort">Ordenar por</label>
            <select class="input" id="f-sort">
              <option value="relevancia">Relevância</option>
              <option value="novidades">Mais recentes</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
            </select>
          </div>
        </div>
        <div class="filters__foot">
          <button class="btn btn--line" type="button" id="f-clear">Limpar</button>
          <button class="btn btn--solid" type="button" data-close-filters id="f-apply">Ver peças</button>
        </div>
      </aside>
      <div class="filters-scrim" id="filters-scrim" hidden></div>

      <div class="catalog__main">
        <div class="catalog__bar">
          <button class="btn btn--line btn--sm filters-open" type="button" id="filters-open" aria-controls="filters" aria-expanded="false">${LC.ICON.filter} Filtrar <span id="filters-n"></span></button>
          <p class="result-count" id="result-count" role="status" aria-live="polite"></p>
          <button class="link-btn small" type="button" id="clear-all" hidden>Limpar filtros</button>
        </div>
        <ul class="active-filters" id="active-filters" aria-label="Filtros ativos" style="margin: .7rem 0 1rem"></ul>
        <div class="grid grid--catalog" id="grid"></div>
        <div class="empty" id="empty" hidden>
          <p class="empty__title">Nenhuma peça encontrada</p>
          <p>Tente outros filtros ou veja todas as peças.</p>
          <button class="btn btn--line" type="button" id="empty-clear">Limpar filtros</button>
        </div>
        <nav class="pagination" id="pagination" aria-label="Páginas"></nav>
      </div>
    </div>`;

  $('#f-sort').value = state.sort;
  const searchInput = headSearch || $('#f-search');
  if (headSearch) headSearch.value = state.query;

  /* Foto do banner da categoria: primeira peça disponível. */
  const bannerImg = $('#cat-banner-img');
  if (bannerImg) {
    const cover = basePool.find((p) => !LC.isSoldOut(p)) || basePool[0];
    if (cover) {
      const img = LC.mainImage(cover, LC.defaultColor(cover));
      bannerImg.src = img.src;
      bannerImg.hidden = false;
      const tag = $('#cat-banner-illus');
      if (tag) tag.hidden = !cover.demo;
    }
  }

  /* ---------- Renderização ---------- */
  function activeChips() {
    const chips = [];
    if (state.collection) chips.push({ k: 'collection', label: `Coleção ${collectionName(state.collection)}` });
    if (state.query.trim()) chips.push({ k: 'query', label: `“${state.query.trim()}”` });
    state.cats.forEach((c) => chips.push({ k: 'cat', v: c, label: c }));
    if (state.isNew) chips.push({ k: 'isNew', label: 'Novidades' });
    if (state.promo) chips.push({ k: 'promo', label: 'Promoções' });
    state.sizes.forEach((s) => chips.push({ k: 'size', v: s, label: `Tam. ${s}` }));
    if (state.min !== null) chips.push({ k: 'min', label: `A partir de ${money(state.min)}` });
    if (state.max !== null) chips.push({ k: 'max', label: `Até ${money(state.max)}` });
    if (state.available) chips.push({ k: 'available', label: 'Disponíveis' });
    return chips;
  }

  function renderRange() {
    const min = $('#f-min');
    if (!min) return;
    const max = $('#f-max');
    const lo = Number(min.value);
    const hi = Number(max.value);
    const span = priceCeil - priceFloor || 1;
    const fill = $('#range-fill');
    fill.style.left = `${((lo - priceFloor) / span) * 100}%`;
    fill.style.right = `${100 - ((hi - priceFloor) / span) * 100}%`;
    $('#range-min').textContent = money(lo);
    $('#range-max').textContent = money(hi);
  }

  function renderPagination(totalPages) {
    const nav = $('#pagination');
    if (totalPages <= 1) { nav.innerHTML = ''; return; }
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    nav.innerHTML = `
      <button type="button" data-page="${state.page - 1}" aria-label="Página anterior" ${state.page === 1 ? 'disabled' : ''}>‹</button>
      ${pages.map((n) => `<button type="button" data-page="${n}"${n === state.page ? ' aria-current="page"' : ''} aria-label="Página ${n}">${n}</button>`).join('')}
      <button type="button" data-page="${state.page + 1}" aria-label="Próxima página" ${state.page === totalPages ? 'disabled' : ''}>›</button>`;
  }

  function render() {
    const list = results();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);
    const pageItems = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    $('#grid').innerHTML = pageItems.map((p, i) => LC.card(p, { eager: i < 3 })).join('');
    $('#empty').hidden = list.length > 0;
    const from = list.length ? (state.page - 1) * PAGE_SIZE + 1 : 0;
    $('#result-count').textContent = list.length > PAGE_SIZE
      ? `${from}–${from + pageItems.length - 1} de ${list.length} produtos`
      : `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
    const chips = activeChips();
    $('#active-filters').innerHTML = chips.map((c) => `<li><button type="button" class="chip" data-k="${c.k}" data-v="${esc(c.v || '')}" aria-label="Remover filtro ${esc(c.label)}">${esc(c.label)} <span aria-hidden="true">×</span></button></li>`).join('');
    $('#clear-all').hidden = chips.length === 0;
    $('#filters-n').textContent = chips.length ? `(${chips.length})` : '';
    $('#f-apply').textContent = `Ver ${list.length} ${list.length === 1 ? 'peça' : 'peças'}`;
    renderRange();
    renderPagination(totalPages);
    syncUrl();
  }

  const refresh = () => { state.page = 1; render(); };

  function clearAll() {
    state.collection = ''; state.query = ''; state.cats.clear(); state.sizes.clear();
    state.min = null; state.max = null; state.isNew = false; state.promo = false; state.available = false;
    if (searchInput) searchInput.value = '';
    if ($('#f-min')) { $('#f-min').value = priceFloor; $('#f-max').value = priceCeil; }
    $$('#filters input[type="checkbox"]').forEach((i) => { i.checked = false; });
    refresh();
  }

  /* ---------- Eventos ---------- */
  let typing;
  if (searchInput) searchInput.addEventListener('input', (e) => { clearTimeout(typing); typing = setTimeout(() => { state.query = e.target.value; refresh(); }, 200); });
  if (headSearch && headSearch.form) headSearch.form.addEventListener('submit', (e) => { e.preventDefault(); state.query = headSearch.value; refresh(); });

  const onRange = (e) => {
    const min = $('#f-min');
    const max = $('#f-max');
    if (Number(min.value) > Number(max.value)) { if (e.target === min) min.value = max.value; else max.value = min.value; }
    renderRange();
    clearTimeout(typing);
    typing = setTimeout(() => {
      state.min = Number(min.value) > priceFloor ? Number(min.value) : null;
      state.max = Number(max.value) < priceCeil ? Number(max.value) : null;
      refresh();
    }, 150);
  };
  if ($('#f-min')) { $('#f-min').addEventListener('input', onRange); $('#f-max').addEventListener('input', onRange); }

  $('#filters').addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'cat') { t.checked ? state.cats.add(t.value) : state.cats.delete(t.value); refresh(); }
    if (t.name === 'size') { t.checked ? state.sizes.add(t.value) : state.sizes.delete(t.value); refresh(); }
    if (t.name === 'flag') { state[t.value] = t.checked; refresh(); }
    if (t.id === 'f-sort') { state.sort = t.value; refresh(); }
  });
  $('#f-clear').addEventListener('click', clearAll);
  $('#empty-clear').addEventListener('click', clearAll);
  $('#clear-all').addEventListener('click', clearAll);

  $('#pagination').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-page]');
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.page);
    render();
    $('#catalog-root').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#active-filters').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    const { k, v } = b.dataset;
    const uncheck = (sel) => { const i = $(sel); if (i) i.checked = false; };
    if (k === 'collection') state.collection = '';
    if (k === 'query') { state.query = ''; if (searchInput) searchInput.value = ''; }
    if (k === 'cat') { state.cats.delete(v); uncheck(`#filters input[name="cat"][value="${CSS.escape(v)}"]`); }
    if (k === 'size') { state.sizes.delete(v); uncheck(`#filters input[name="size"][value="${CSS.escape(v)}"]`); }
    if (k === 'min') { state.min = null; $('#f-min').value = priceFloor; }
    if (k === 'max') { state.max = null; $('#f-max').value = priceCeil; }
    if (['isNew', 'promo', 'available'].includes(k)) { state[k] = false; uncheck(`#filters input[name="flag"][value="${k}"]`); }
    refresh();
  });

  /* Gaveta de filtros no celular */
  const panel = $('#filters');
  const scrim = $('#filters-scrim');
  const openBtn = $('#filters-open');
  const setPanel = (open) => {
    panel.classList.toggle('is-open', open);
    scrim.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('.filters__close').focus(); else openBtn.focus({ preventScroll: true });
  };
  openBtn.addEventListener('click', () => setPanel(true));
  scrim.addEventListener('click', () => setPanel(false));
  $$('[data-close-filters]', panel).forEach((b) => b.addEventListener('click', () => { if (panel.classList.contains('is-open')) setPanel(false); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) setPanel(false); });

  render();
})();
