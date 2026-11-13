/* ==========================================================
   Página de produto (produto.html?id=...).
   Galeria com miniaturas, cor, tamanho, disponibilidade,
   "Comprar agora" (vai direto ao checkout, sem mexer no carrinho)
   e "Adicionar ao carrinho" (confirma e continua navegando).
   Depende de: utils.js, cart.js, main.js, shipping.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { CFG, ICON, $, $$, esc, money } = LC;
  const root = $('#pdp-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id') || '';
  const p = LC.byId(id);

  if (!p) {
    document.title = `Produto não encontrado — ${CFG.storeName}`;
    root.innerHTML = `
      <div class="notfound">
        <h1>Não encontramos esta peça</h1>
        <p>Ela pode ter saído do catálogo ou o endereço está incompleto.</p>
        <a class="btn btn--solid" href="${LC.url('produtos.html')}">Ver todas as roupas ${ICON.arrowRight}</a>
      </div>`;
    if ($('#related')) $('#related').hidden = true;
    return;
  }

  const multiColor = LC.hasColorChoice(p);
  const soldOut = LC.isSoldOut(p);
  const sizes = LC.sortSizes(p.sizes);
  const state = { color: multiColor ? '' : LC.defaultColor(p), size: '', qty: 1 };
  if (sizes.length === 1 && !soldOut) state.size = sizes[0];

  document.title = `${p.name} — ${CFG.storeName}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', `${p.name}. ${p.description || ''}`.slice(0, 160));

  const crumbs = $('#breadcrumb');
  if (crumbs) {
    crumbs.innerHTML = `<ol>
      <li><a href="${LC.url('index.html')}">Início</a></li>
      <li><a href="${LC.categoryUrl(p.category)}">${esc(p.category)}</a></li>
      <li aria-current="page">${esc(p.name)}</li></ol>`;
  }

  const stockFor = (size) => LC.stockOf(p, state.color || LC.defaultColor(p), size);
  /* Com várias cores e nenhuma escolhida, o tamanho conta como disponível se existir em alguma cor. */
  const sizeAvailable = (size) => (multiColor && !state.color
    ? p.colors.some((c) => LC.stockOf(p, c.name, size) > 0)
    : stockFor(size) > 0);

  /* Parcelamento: só aparece se a loja configurar (config.js → installments). */
  const inst = CFG.installments || {};
  const unit = LC.unitPrice(p);
  const nInst = Math.min(Number(inst.maxNoInterest) || 0, inst.minInstallment > 0 ? Math.floor(unit / inst.minInstallment) : Infinity);
  const installmentsHtml = nInst > 1 ? `<p class="pdp__installments">ou até ${nInst}x de ${money(unit / nInst)} sem juros</p>` : '';

  const priceHtml = LC.onSale(p)
    ? `<span class="pdp__now"><span class="sr-only">Por </span>${money(p.promoPrice)}</span>
       <span class="pdp__old"><span class="sr-only">de </span>${money(p.price)}</span>
       <span class="badge-off">${LC.discountPct(p)}% OFF</span>`
    : `<span class="pdp__now">${money(p.price)}</span>`;

  const pickupStores = LC.stores().filter((s) => s.pickup);
  const singleColor = !multiColor && p.colors && p.colors[0];

  root.innerHTML = `
    <div class="pdp">
      <div class="gallery" id="gallery" aria-label="Fotos do produto"></div>

      <div class="pdp__info">
        <h1 class="pdp__title">${esc(p.name)}</h1>
        ${soldOut ? `
          <div class="soldout">
            <span class="soldout__badge">ESGOTADO</span>
            <p class="muted">Este produto não está disponível no momento.</p>
          </div>` : `
          <p class="pdp__price">${priceHtml}</p>
          ${installmentsHtml}`}
        ${p.demo ? '<p class="pdp__demo">Produto demonstrativo: as fotos são ilustrativas (banco de imagens) e não mostram uma peça do acervo oficial.</p>' : ''}

        <form class="pdp__form" id="pdp-form" novalidate>
          <fieldset class="opt-group" id="color-group">
            <legend>Cor: <span id="color-label">${multiColor ? 'escolha uma cor' : esc(state.color || '—')}</span></legend>
            ${multiColor ? `<div class="color-opts">${p.colors.map((c) => `
              <label class="color-opt" title="${esc(c.name)}">
                <input type="radio" name="color" value="${esc(c.name)}" ${soldOut ? 'disabled' : ''}>
                <span style="--sw:${LC.safeColor(c.hex)}"><span class="sr-only">${esc(c.name)}</span></span>
              </label>`).join('')}</div>`
              : singleColor ? `<span class="color-single"><span class="swatch" style="--sw:${LC.safeColor(singleColor.hex)}"></span></span>` : ''}
          </fieldset>

          <fieldset class="opt-group">
            <legend>Tamanho: <span id="size-label">${state.size ? esc(state.size) : 'escolha um tamanho'}</span></legend>
            <div class="size-opts" id="size-opts"></div>
            ${!soldOut ? sizeHelpLink() : ''}
          </fieldset>

          <p class="availability" id="availability"></p>
          <p class="form-error" id="pdp-error" role="alert"></p>

          <div class="pdp__actions">
            <button class="btn btn--solid btn--block btn--lg" type="submit" id="buy-now" ${soldOut ? 'disabled aria-disabled="true"' : ''}>Comprar agora</button>
            <button class="btn btn--line btn--block btn--lg" type="button" id="add-cart" ${soldOut ? 'disabled aria-disabled="true"' : ''}>Adicionar ao carrinho</button>
          </div>
        </form>

        ${soldOut ? `
          <div class="soldout">
            <p class="soldout__msg">${ICON.alert} Este produto está esgotado no momento.</p>
            <button class="btn btn--line btn--block" type="button" id="restock-toggle" aria-expanded="false" aria-controls="restock">${ICON.bell} Avise-me quando voltar</button>
            <div id="restock" hidden></div>
          </div>` : ''}

        <ul class="perks">
          <li>${ICON.truck}<span>Entrega para todo o Brasil</span></li>
          ${pickupStores.length ? `<li>${ICON.store}<span>Retire na loja sem custo de frete</span></li>` : ''}
          <li>${ICON.exchange}<a href="${LC.url('informacoes.html#trocas')}">Trocas e devoluções</a></li>
          <li>${ICON.lock}<span>Compra segura com Mercado Pago</span></li>
        </ul>

        <div class="accordion">
          <details open>
            <summary>Descrição</summary>
            <div class="accordion__body"><p>${esc(p.description)}</p></div>
          </details>
          ${(p.details || []).length ? `<details>
            <summary>Informações adicionais</summary>
            <div class="accordion__body"><ul class="bullets">${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
          </details>` : ''}
          ${p.care ? `<details><summary>Cuidados</summary><div class="accordion__body"><p>${esc(p.care)}</p></div></details>` : ''}
          <details>
            <summary>Calcular frete</summary>
            <div class="accordion__body">
              <form class="cep-box" id="cep-box" novalidate>
                <label class="sr-only" for="cep-input">CEP</label>
                <div class="cep-box__row">
                  <input class="input" id="cep-input" inputmode="numeric" autocomplete="postal-code" placeholder="Digite seu CEP" maxlength="9">
                  <button class="btn btn--line" type="submit">Calcular</button>
                </div>
                <div class="cep-box__out" id="cep-out" aria-live="polite"></div>
              </form>
            </div>
          </details>
        </div>
      </div>
    </div>`;

  function sizeHelpLink() {
    const s = LC.stores().find((x) => LC.waLink(x.whatsapp));
    const href = s ? LC.waLink(s.whatsapp, `Olá! Tenho uma dúvida sobre o tamanho da peça "${p.name}".`) : LC.instagramDm();
    return href ? `<a class="size-help" href="${href}" target="_blank" rel="noopener noreferrer">Dúvida no tamanho? Fale com a gente</a>` : '';
  }

  /* ---------- Galeria: miniaturas + foto principal ---------- */
  function renderGallery() {
    const imgs = LC.imagesFor(p, state.color);
    $('#gallery').innerHTML = `
      ${imgs.length > 1 ? `
        <div class="gallery__thumbs" role="tablist" aria-label="Escolher foto">
          ${imgs.map((img, i) => `<button type="button" role="tab" class="gallery__thumb" data-i="${i}" aria-selected="${i === 0}" aria-label="Foto ${i + 1} de ${imgs.length}"><img src="${esc(img.src)}" alt="" width="160" height="200" loading="lazy"></button>`).join('')}
        </div>` : ''}
      <div class="gallery__main">
        <div class="gallery__track" id="g-track" tabindex="0" aria-label="Fotos: role para o lado para ver mais">
          ${imgs.map((img, i) => `
            <figure class="gallery__slide">
              <img src="${esc(img.src)}" alt="${esc(img.alt || p.name)}" width="800" height="1000" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
              ${p.demo ? '<figcaption class="illus">Imagem ilustrativa</figcaption>' : ''}
            </figure>`).join('')}
        </div>
        ${soldOut ? '<span class="gallery__soldout tag tag--soldout">Esgotado</span>' : ''}
      </div>`;

    const track = $('#g-track');
    const thumbs = $$('.gallery__thumb');
    thumbs.forEach((t) => t.addEventListener('click', () => {
      track.scrollTo({ left: track.clientWidth * Number(t.dataset.i), behavior: 'smooth' });
    }));
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        thumbs.forEach((t, j) => t.setAttribute('aria-selected', String(i === j)));
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Tamanhos e disponibilidade ---------- */
  function renderSizes() {
    $('#size-opts').innerHTML = sizes.map((s) => {
      const ok = sizeAvailable(s);
      return `<label class="size-opt${ok ? '' : ' is-out'}">
        <input type="radio" name="size" value="${esc(s)}" ${state.size === s ? 'checked' : ''} ${ok ? '' : 'disabled'}>
        <span>${esc(s)}${ok ? '' : '<span class="sr-only"> (esgotado)</span>'}</span>
      </label>`;
    }).join('');
  }

  function renderAvailability() {
    const el = $('#availability');
    if (soldOut) { el.hidden = true; return; }
    if (!state.size || (multiColor && !state.color)) { el.textContent = 'Disponível'; el.className = 'availability is-ok'; return; }
    const n = stockFor(state.size);
    if (n === 0) { el.textContent = 'Esgotado neste tamanho'; el.className = 'availability is-out'; }
    else if (n <= 2) { el.textContent = 'Últimas unidades'; el.className = 'availability is-low'; }
    else { el.textContent = 'Disponível'; el.className = 'availability is-ok'; }
  }

  const form = $('#pdp-form');
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'color') {
      state.color = t.value;
      $('#color-label').textContent = t.value;
      if (state.size && !sizeAvailable(state.size)) state.size = '';
      $('#size-label').textContent = state.size || 'escolha um tamanho';
      renderGallery(); renderSizes();
    }
    if (t.name === 'size') { state.size = t.value; $('#size-label').textContent = t.value; }
    $('#pdp-error').textContent = '';
    renderAvailability();
  });

  function validate() {
    const err = $('#pdp-error');
    if (soldOut) { err.textContent = 'Esta peça está esgotada.'; return false; }
    if (multiColor && !state.color) {
      err.textContent = 'Escolha uma cor para continuar.';
      $('#color-group input:not(:disabled)').focus();
      return false;
    }
    if (!state.size) {
      err.textContent = 'Escolha um tamanho para continuar.';
      const first = $('#size-opts input:not(:disabled)');
      if (first) first.focus();
      return false;
    }
    if (stockFor(state.size) === 0) { err.textContent = 'Este tamanho está esgotado. Escolha outro.'; return false; }
    err.textContent = '';
    return true;
  }

  const selection = () => ({ id: p.id, color: state.color, size: state.size, qty: state.qty });

  /* Comprar agora: valida, separa este item como pedido e vai direto ao checkout. */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    LC.buyNow.set(selection());
    location.href = LC.url('checkout.html?origem=comprar-agora');
  });

  /* Adicionar ao carrinho: confirma de forma discreta e a pessoa continua navegando. */
  $('#add-cart').addEventListener('click', () => {
    if (!validate()) return;
    const r = LC.cart.add(selection());
    if (!r.ok) { $('#pdp-error').textContent = r.reason; return; }
    const img = LC.mainImage(p, state.color);
    LC.toast(`
      <span class="toast__item">
        <img src="${esc(img.src)}" alt="" width="40" height="50">
        <span><strong>Adicionado ao carrinho</strong><br>${esc(p.name)} · Tam. ${esc(state.size)}${r.limited ? ' (limitado ao estoque)' : ''}</span>
      </span>
      <a class="toast__link" href="${LC.url('carrinho.html')}">Ver carrinho</a>`);
  });

  /* ---------- Frete na página do produto ---------- */
  const cepInput = $('#cep-input');
  cepInput.addEventListener('input', () => { cepInput.value = LC.mask.cep(cepInput.value); });
  $('#cep-box').addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#cep-out');
    const cep = LC.digits(cepInput.value);
    if (cep.length !== 8) { out.innerHTML = '<p class="form-error">Digite um CEP com 8 números.</p>'; return; }
    out.innerHTML = '<p class="muted small">Consultando…</p>';
    let place = '';
    try { const a = await LC.shipping.lookupCep(cep); place = `${a.city} — ${a.state}`; } catch (err) { out.innerHTML = `<p class="form-error">${esc(err.message)}</p>`; return; }
    const sizeForQuote = state.size || sizes.find(sizeAvailable) || sizes[0];
    const r = await LC.shipping.quote(cep, [{ id: p.id, color: state.color || LC.defaultColor(p), size: sizeForQuote, qty: state.qty }]);
    if (r.available) {
      out.innerHTML = `<p class="muted small">Para ${esc(place)}:</p><ul class="quote-list">${r.options.map((o) => `
        <li><span>${esc(o.company)} ${esc(o.service)}<small>${esc(LC.shipping.deliveryText(o.days))}</small></span><strong>${money(o.price)}</strong></li>`).join('')}</ul>`;
    } else {
      out.innerHTML = `<div class="notice notice--warn"><p><strong>Cotação indisponível.</strong> ${esc(r.reason)} Para ${esc(place)}, fale com a loja para saber o valor do envio${pickupStores.length ? ' ou escolha retirar na loja no checkout' : ''}.</p>
        ${LC.shipping.contactHtml(`Olá! Gostaria de saber o frete da peça "${p.name}" para o CEP ${LC.mask.cep(cep)}.`)}</div>`;
    }
  });

  /* ---------- Avise-me (só com backend e consentimento) ---------- */
  async function renderRestock() {
    const box = $('#restock');
    const status = await LC.integrations();
    if (!status.restockAlerts) {
      box.innerHTML = `<div class="notice"><p>O aviso automático ainda não está ativo. Fale com a loja para saber da reposição:</p>${LC.shipping.contactHtml(`Olá! Gostaria de ser avisada quando a peça "${p.name}" voltar ao estoque.`)}</div>`;
      return;
    }
    box.innerHTML = `
      <form class="restock-form" id="restock-form" novalidate>
        <p class="restock-form__title">Receba um e-mail quando a peça voltar</p>
        <label class="sr-only" for="rs-email">Seu e-mail</label>
        <input class="input" id="rs-email" type="email" autocomplete="email" placeholder="seu@email.com" required>
        <select class="input" id="rs-size" aria-label="Tamanho desejado">
          <option value="">Qualquer tamanho</option>
          ${sizes.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
        </select>
        <label class="check check--consent"><input type="checkbox" id="rs-consent" required>
          <span id="rs-consent-text">Autorizo a ${esc(CFG.storeName)} a usar meu e-mail somente para avisar sobre a volta desta peça.</span></label>
        <button class="btn btn--solid" type="submit">Avise-me</button>
        <p class="form-error" id="rs-msg" role="alert"></p>
      </form>`;
    $('#restock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#rs-msg');
      const email = $('#rs-email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Digite um e-mail válido.'; return; }
      if (!$('#rs-consent').checked) { msg.textContent = 'Marque a autorização para registrarmos o aviso.'; return; }
      try {
        await LC.api('/restock-alerts', { method: 'POST', body: { productId: p.id, size: $('#rs-size').value, email, consent: true, consentText: $('#rs-consent-text').textContent } });
        $('#restock-form').innerHTML = '<p class="success">Pronto! Avisaremos por e-mail quando a peça voltar.</p>';
      } catch (err) { msg.textContent = err.message; }
    });
  }
  const restockBtn = $('#restock-toggle');
  if (restockBtn) {
    restockBtn.addEventListener('click', async () => {
      const box = $('#restock');
      const open = box.hidden;
      if (open && !box.innerHTML) await renderRestock();
      box.hidden = !open;
      restockBtn.setAttribute('aria-expanded', String(open));
      if (open) { const f = box.querySelector('input, a'); if (f) f.focus(); }
    });
  }

  /* ---------- Relacionados ---------- */
  function renderRelated() {
    const grid = $('#related-grid');
    if (!grid) return;
    const others = LC.PRODUCTS.filter((x) => x.id !== p.id && !LC.isSoldOut(x));
    const same = others.filter((x) => x.category === p.category);
    const rest = others.filter((x) => x.category !== p.category && (p.collection ? x.collection === p.collection : true));
    const pick = [...same, ...rest, ...others].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 4);
    grid.innerHTML = pick.map((x) => LC.card(x)).join('');
    $('#related').hidden = pick.length === 0;
  }

  renderGallery();
  renderSizes();
  renderAvailability();
  renderRelated();
})();
