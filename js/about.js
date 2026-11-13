/* Página "Sobre": lojas físicas vindas do config.js. */
(() => {
  'use strict';
  const LC = window.LC;
  const box = LC.$('#about-stores');
  if (!box) return;
  box.innerHTML = LC.stores().map((s) => {
    const wa = LC.waLink(s.whatsapp, `Olá, ${LC.CFG.storeName}! Vim pelo site.`);
    return `<div class="about__store panel">
      <strong>${LC.esc(s.name)}</strong>
      <span>${LC.esc(s.address)}</span>
      <span>${LC.esc([s.district, s.city].filter(Boolean).join(' · '))}</span>
      ${s.openingHours ? `<span>${LC.esc(s.openingHours)}</span>` : ''}
      ${wa ? `<a href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp ${LC.esc(s.phone || '')}</a>` : ''}
    </div>`;
  }).join('');
})();
