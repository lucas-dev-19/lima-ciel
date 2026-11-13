/* Lista os créditos das fotos ilustrativas (produtos e campanhas) em informacoes.html. */
(() => {
  'use strict';
  const LC = window.LC;
  const list = LC.$('#credits-list');
  if (!list) return;
  const editorial = Object.values(window.LIMA_CIEL_EDITORIAL || {});
  const all = [...LC.PRODUCTS.flatMap((p) => p.images || []), ...editorial].filter((img) => img.credit && img.credit.source);
  const seen = new Set();
  const rows = all.filter((img) => !seen.has(img.credit.source) && seen.add(img.credit.source));
  list.innerHTML = rows.map((img) => {
    const c = img.credit;
    const safe = /^https:\/\//.test(c.source) ? LC.esc(c.source) : '#';
    return `<li>Foto de ${LC.esc(c.photographer || 'autor não informado')} — <a href="${safe}" target="_blank" rel="noopener noreferrer">${LC.esc(c.license || 'ver origem')}</a></li>`;
  }).join('') || '<li>Nenhuma imagem de terceiros em uso.</li>';
})();
