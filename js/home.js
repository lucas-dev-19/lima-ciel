/* ==========================================================
   Página inicial: coleções (categorias), novidades, mais procurados
   e Instagram. Tudo é montado a partir de products.js e config.js.
   Depende de: utils.js, cart.js, main.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { $, esc, PRODUCTS, CATEGORIES } = LC;

  /* Nossas Coleções: uma foto por categoria, com o nome na etiqueta */
  const tiles = $('#home-tiles');
  if (tiles) {
    tiles.innerHTML = CATEGORIES.map((c) => {
      const items = PRODUCTS.filter((p) => p.category === c.name);
      if (!items.length) return '';
      const cover = items.find((p) => !LC.isSoldOut(p)) || items[0];
      const img = LC.mainImage(cover, LC.defaultColor(cover));
      return `
        <a class="tile" href="${LC.url(`categorias/${c.slug}.html`)}">
          <img src="${esc(img.src)}" alt="" width="700" height="875" loading="lazy" decoding="async">
          ${cover.demo ? '<span class="illus">Imagem ilustrativa</span>' : ''}
          <span class="tile__label">${esc(c.name)}</span>
        </a>`;
    }).join('');
  }

  /* Novidades */
  const fresh = PRODUCTS.filter((p) => p.isNew && !LC.isSoldOut(p));
  const newGrid = $('#home-new');
  if (newGrid) {
    newGrid.innerHTML = fresh.slice(0, 4).map((p) => LC.card(p)).join('');
    newGrid.closest('section').hidden = fresh.length === 0;
  }

  /* Mais procurados */
  const best = $('#home-best');
  if (best) {
    const list = PRODUCTS.filter((p) => p.featured).slice(0, 4);
    best.innerHTML = list.map((p) => LC.card(p)).join('');
    best.closest('section').hidden = list.length === 0;
  }

  /* Instagram: fotos ilustrativas com link para o perfil oficial */
  const insta = $('#home-insta');
  const igUrl = LC.CFG.instagram && LC.CFG.instagram.url;
  if (insta) {
    const pics = PRODUCTS.flatMap((p) => LC.imagesFor(p).slice(1, 2)).slice(0, 6);
    insta.innerHTML = pics.map((img) => `
      <a href="${esc(igUrl || '#')}" target="_blank" rel="noopener noreferrer" aria-label="Abrir o Instagram da loja">
        <img src="${esc(img.src)}" alt="" width="400" height="500" loading="lazy" decoding="async">
      </a>`).join('');
    insta.closest('section').hidden = !igUrl || pics.length === 0;
  }
})();
