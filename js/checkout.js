/* ==========================================================
   Checkout (checkout.html) — uma tela por etapa:
   1. Identificação  →  2. Entrega ou retirada  →  3. Endereço + frete | Loja de retirada  →  4. Resumo e pagamento
   - Itens vêm do carrinho ou de "Comprar agora" (?origem=comprar-agora).
   - Frete: só cotação real do backend. Sem cotação, a entrega não segue pelo site.
   - Pagamento: Mercado Pago Checkout Pro via backend, limitado à forma escolhida. Nada é simulado.
   Depende de: utils.js, cart.js, main.js, shipping.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { CFG, ICON, $, $$, esc, money } = LC;
  const form = $('#checkout-form');
  if (!form) return;

  const DRAFT_KEY = 'limaciel.checkout.draft';
  const LAST_ORDER_KEY = 'limaciel.lastOrder';
  const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const PAY_LABEL = { pix: 'Pix', credito: 'Cartão de crédito', debito: 'Cartão de débito' };
  const requireCpf = !!(CFG.checkout && CFG.checkout.requireCpf);
  const pickupStores = LC.stores().filter((s) => s.pickup);

  /* ---------- Itens do pedido ---------- */
  const isBuyNow = new URLSearchParams(location.search).get('origem') === 'comprar-agora';
  const items = isBuyNow ? [LC.buyNow.get()].filter(Boolean) : LC.cart.items();

  function block(title, text, actions) {
    $('#stepper').hidden = true;
    $('#checkout').innerHTML = `
      <div class="cart-empty" style="grid-column:1/-1">
        ${ICON.bag}
        <h1>${title}</h1>
        <p>${text}</p>
        <div class="cart-empty__actions">${actions}</div>
      </div>`;
  }

  if (!items.length) {
    if (isBuyNow) block('A seleção expirou', 'Volte ao produto e clique em “Comprar agora” novamente.', `<a class="btn btn--solid" href="${LC.url('produtos.html')}">Ver roupas ${ICON.arrowRight}</a>`);
    else block('Seu carrinho está vazio', 'Adicione peças ao carrinho para finalizar um pedido.', `<a class="btn btn--solid" href="${LC.url('produtos.html')}">Ver roupas ${ICON.arrowRight}</a>`);
    return;
  }
  const unavailable = items.filter((i) => LC.stockOf(LC.byId(i.id), i.color, i.size) < i.qty);
  if (unavailable.length) {
    block('Algumas peças ficaram indisponíveis', 'Revise o pedido antes de finalizar.', `<a class="btn btn--solid" href="${LC.url(isBuyNow ? `produto.html?id=${encodeURIComponent(items[0].id)}` : 'carrinho.html')}">Revisar</a>`);
    return;
  }

  if (isBuyNow) {
    const note = $('#origin-note');
    note.hidden = false;
    note.textContent = 'Compra direta: este pedido contém só a peça escolhida e não altera seu carrinho.';
  }
  if (!pickupStores.length) $('#pickup-option').hidden = true;

  const subtotal = items.reduce((s, i) => s + LC.unitPrice(LC.byId(i.id)) * i.qty, 0);
  const state = {
    step: 1,
    method: '',
    quote: null,          // { available, options } | { available:false, reason } | 'loading'
    quoteCep: '',
    shipping: null,
    storeId: pickupStores.length === 1 ? pickupStores[0].id : '',
    pay: '',
    integrations: null
  };

  /* ---------- "Seu pedido" (lateral) ---------- */
  function shippingCost() {
    if (state.method === 'retirada') return 0;
    if (state.method === 'entrega' && state.shipping) return state.shipping.price;
    return null;
  }

  function renderSummary() {
    const ship = shippingCost();
    const total = subtotal + (ship || 0);
    let shipText = '<span class="muted">A calcular</span>';
    if (state.method === 'retirada') shipText = 'Grátis (retirada)';
    else if (state.method === 'entrega' && state.shipping) shipText = money(state.shipping.price);

    $('#summary-body').innerHTML = `
      <ul class="sum-items">
        ${items.map((i) => {
          const p = LC.byId(i.id);
          const img = LC.mainImage(p, i.color);
          return `<li>
            <span class="sum-items__img"><img src="${esc(img.src)}" alt="" width="64" height="80"></span>
            <span class="sum-items__info">
              <strong>${esc(p.name)}</strong>
              <small>Tam: ${esc(i.size)}${i.color ? ` • Cor: ${esc(i.color)}` : ''}${i.qty > 1 ? ` • Qtd: ${i.qty}` : ''}</small>
              <b>${money(LC.unitPrice(p) * i.qty)}</b>
            </span>
          </li>`;
        }).join('')}
      </ul>
      <dl class="summary__rows">
        <div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>
        <div><dt>Frete</dt><dd>${shipText}</dd></div>
      </dl>
      <div class="summary__total"><span>Total</span><strong>${money(total)}</strong></div>
      <p class="summary__note">${ICON.lock} Compra 100% segura</p>`;
    $('#summary-toggle-total').textContent = money(total);
    return total;
  }

  /* ---------- Campos e validação ---------- */
  function setError(input, msg) {
    const el = $(`#err-${input.id}`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (el) el.textContent = msg || '';
    return !msg;
  }

  const validators = {
    'c-name': (v) => (v.trim().split(/\s+/).length < 2 ? 'Informe nome e sobrenome.' : ''),
    'c-email': (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Digite um e-mail válido.'),
    'c-phone': (v) => (/^\d{10,11}$/.test(LC.digits(v)) ? '' : 'Digite o telefone com DDD.'),
    'c-cpf': (v) => {
      if (!v.trim() && !requireCpf) return '';
      return LC.isValidCpf(v) ? '' : 'CPF inválido. Confira os números.';
    },
    'a-cep': (v) => (/^\d{8}$/.test(LC.digits(v)) ? '' : 'Digite um CEP com 8 números.'),
    'a-street': (v) => (v.trim() ? '' : 'Informe a rua.'),
    'a-number': (v) => (v.trim() ? '' : 'Informe o número (ou “S/N”).'),
    'a-district': (v) => (v.trim() ? '' : 'Informe o bairro.'),
    'a-city': (v) => (v.trim() ? '' : 'Informe a cidade.'),
    'a-state': (v) => (UFS.includes(v) ? '' : 'Escolha o estado.')
  };

  function validateFields(ids) {
    let firstBad = null;
    ids.forEach((fid) => {
      const input = $(`#${fid}`);
      const ok = setError(input, validators[fid](input.value));
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  $('#c-phone').addEventListener('input', (e) => { e.target.value = LC.mask.phone(e.target.value); });
  $('#c-cpf').addEventListener('input', (e) => { e.target.value = LC.mask.cpf(e.target.value); });
  $('#a-cep').addEventListener('input', (e) => { e.target.value = LC.mask.cep(e.target.value); });
  form.addEventListener('focusout', (e) => {
    const v = validators[e.target.id];
    if (v && e.target.value) setError(e.target, v(e.target.value));
  });
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && validators[e.target.id] && !validators[e.target.id](e.target.value)) setError(e.target, '');
  });

  if (!requireCpf) {
    $('#c-cpf-label').textContent = 'CPF (opcional)';
    $('#c-cpf').removeAttribute('required');
  }
  $('#a-state').innerHTML = '<option value="">Selecione</option>' + UFS.map((u) => `<option>${u}</option>`).join('');

  /* Rascunho na sessão (sem CPF), para não perder os dados ao atualizar a página. */
  const DRAFT_FIELDS = ['c-name', 'c-email', 'c-phone', 'a-cep', 'a-street', 'a-number', 'a-complement', 'a-district', 'a-city', 'a-state'];
  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(Object.fromEntries(DRAFT_FIELDS.map((fid) => [fid, $(`#${fid}`).value])))); } catch (_) { /* ignora */ }
  }
  function loadDraft() {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      DRAFT_FIELDS.forEach((fid) => { if (typeof d[fid] === 'string') $(`#${fid}`).value = d[fid]; });
    } catch (_) { /* ignora */ }
  }
  form.addEventListener('input', saveDraft);

  /* ---------- Navegação entre as telas ---------- */
  function goTo(step, { focus = true } = {}) {
    state.step = step;
    $$('.co-card', form).forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
    $$('#stepper li').forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-active', n === step);
      li.classList.toggle('is-done', n < step);
      if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      const dot = $('.stepper__dot', li);
      dot.innerHTML = n < step ? '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:13px;height:13px"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : String(n);
    });
    if (step === 3) {
      const pickup = state.method === 'retirada';
      $('#address-screen').hidden = pickup;
      $('#pickup-screen').hidden = !pickup;
      if (!pickup && state.quoteCep !== LC.digits($('#a-cep').value)) requestQuote();
    }
    if (step === 4) renderReview();
    renderSummary();
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const title = step === 3 && state.method === 'retirada' ? $('#pickup-title') : $(`#step-${step} h2`);
      if (title) title.focus({ preventScroll: true });
    }
  }

  form.addEventListener('click', (e) => {
    const back = e.target.closest('[data-back]');
    if (back) { goTo(Number(back.dataset.back)); return; }
    const next = e.target.closest('[data-next]');
    if (!next) return;
    const n = next.dataset.next;
    if (n === '1' && validateFields(['c-name', 'c-email', 'c-phone', 'c-cpf'])) goTo(2);
    if (n === '2') {
      if (!state.method) { $('#err-method').textContent = 'Escolha como deseja receber seu pedido.'; $('#method-home').focus(); return; }
      $('#step3-label').textContent = state.method === 'retirada' ? 'Retirada' : 'Endereço';
      goTo(3);
    }
    if (n === '3' && validateStep3()) goTo(4);
  });

  /* ---------- Etapa 2: entrega ou retirada ---------- */
  form.addEventListener('change', (e) => {
    if (e.target.name === 'method') {
      state.method = e.target.value;
      $('#err-method').textContent = '';
      $('#step3-label').textContent = state.method === 'retirada' ? 'Retirada' : 'Endereço';
      renderSummary();
    }
    if (e.target.name === 'store') { state.storeId = e.target.value; $('#err-store').textContent = ''; }
    if (e.target.name === 'ship') {
      state.shipping = state.quote.options.find((o) => o.id === e.target.value) || null;
      $('#err-ship').textContent = '';
      renderSummary();
    }
    if (e.target.name === 'pay') { state.pay = e.target.value; $('#err-pay-method').textContent = ''; renderPayButton(); }
  });

  /* ---------- Etapa 3B: retirada na loja ---------- */
  function renderPickup() {
    if (!pickupStores.length) return;
    $('#pickup-box').innerHTML = `
      <fieldset class="stores">
        <legend class="sr-only">Escolha a loja</legend>
        ${pickupStores.map((s) => `
          <label class="store-card">
            <input type="radio" name="store" value="${esc(s.id)}" ${state.storeId === s.id ? 'checked' : ''}>
            <span class="store-card__body">
              <strong>${esc(s.name)}</strong>
              <span class="store-card__row">${ICON.pin}<span>${esc(s.address)}<br>${esc([s.district, s.city].filter(Boolean).join(' · '))}${s.cep ? ` · CEP ${esc(s.cep)}` : ''}</span></span>
              <span class="store-card__row">${ICON.clock}<span>${s.openingHours ? esc(s.openingHours) : 'Horário de funcionamento: confirme com a loja'}${s.phone ? `<br>Telefone/WhatsApp: ${esc(s.phone)}` : ''}</span></span>
            </span>
          </label>`).join('')}
      </fieldset>
      <p class="field__error" id="err-store" role="alert"></p>
      <p class="notice" style="margin-top:.8rem">Sem custo de frete. ${CFG.pickupInstructions ? esc(CFG.pickupInstructions) : 'A disponibilidade e o prazo de retirada serão confirmados pela loja após a confirmação do pagamento. Aguarde o contato antes de ir até a loja.'}</p>`;
  }

  /* ---------- Etapa 3A: endereço (ViaCEP) e frete ---------- */
  let lastLookup = '';
  $('#a-cep').addEventListener('input', async (e) => {
    const cep = LC.digits(e.target.value);
    const hint = $('#cep-hint');
    if (cep !== state.quoteCep) { state.quote = null; state.shipping = null; state.quoteCep = ''; renderQuote(); renderSummary(); }
    if (cep.length !== 8) return;
    if (cep !== lastLookup) {
      lastLookup = cep;
      hint.textContent = 'Buscando endereço…';
      try {
        const a = await LC.shipping.lookupCep(cep);
        if (LC.digits($('#a-cep').value) !== cep) return;
        const fill = (fid, value) => { const el = $(`#${fid}`); if (value) { el.value = value; setError(el, ''); } };
        fill('a-street', a.street); fill('a-district', a.district); fill('a-city', a.city); fill('a-state', a.state);
        hint.textContent = `${a.city} — ${a.state}`;
        saveDraft();
        (a.street ? $('#a-number') : $('#a-street')).focus();
      } catch (err) {
        hint.textContent = err.message;
      }
    }
    if (state.method === 'entrega' && state.quoteCep !== cep) requestQuote();
  });

  async function requestQuote() {
    const cep = LC.digits($('#a-cep').value);
    if (!/^\d{8}$/.test(cep)) { renderQuote(); return; }
    state.quoteCep = cep;
    state.quote = 'loading';
    state.shipping = null;
    renderQuote();
    const r = await LC.shipping.quote(cep, items.map(({ id, color, size, qty }) => ({ id, color, size, qty })));
    if (state.quoteCep !== cep) return;
    state.quote = r;
    if (r.available && r.options.length === 1) state.shipping = r.options[0];
    renderQuote();
    renderSummary();
  }

  function renderQuote() {
    const box = $('#quote-box');
    const q = state.quote;
    if (!q) { box.innerHTML = '<p class="muted small">Informe o CEP para ver as opções de frete.</p>'; return; }
    if (q === 'loading') { box.innerHTML = '<p class="muted small" role="status">Consultando transportadoras…</p>'; return; }
    if (q.available) {
      box.innerHTML = `
        <fieldset class="ship-opts">
          <legend>Opções de frete para o CEP ${LC.mask.cep(state.quoteCep)}</legend>
          ${q.options.map((o) => `
            <label class="ship-opt">
              <input type="radio" name="ship" value="${esc(o.id)}" ${state.shipping && state.shipping.id === o.id ? 'checked' : ''}>
              <span class="ship-opt__name">${esc(o.company)} ${esc(o.service)}<small>${esc(LC.shipping.deliveryText(o.days))} após a postagem</small></span>
              <strong>${money(o.price)}</strong>
            </label>`).join('')}
        </fieldset>
        <p class="field__error" id="err-ship" role="alert"></p>`;
      return;
    }
    box.innerHTML = `
      <div class="notice notice--warn" role="status">
        <p><strong>Cotação de frete indisponível.</strong> ${esc(q.reason)}</p>
        <p>Não exibimos valores estimados: o frete precisa ser cotado com as transportadoras. Você pode ${pickupStores.length ? '<button type="button" class="link-btn" id="switch-pickup">retirar na loja sem frete</button> ou ' : ''}falar com a loja para combinar o envio:</p>
        ${LC.shipping.contactHtml(orderMessage({ withAddress: true }))}
      </div>
      <p class="field__error" id="err-ship" role="alert"></p>`;
    const sw = $('#switch-pickup');
    if (sw) sw.addEventListener('click', () => {
      $('#method-pickup').checked = true;
      state.method = 'retirada';
      $('#step3-label').textContent = 'Retirada';
      goTo(3);
    });
  }

  function validateStep3() {
    if (state.method === 'retirada') {
      if (!state.storeId) { $('#err-store').textContent = 'Escolha a loja de retirada.'; const r = $('input[name="store"]'); if (r) r.focus(); return false; }
      return true;
    }
    if (!validateFields(['a-cep', 'a-street', 'a-number', 'a-district', 'a-city', 'a-state'])) return false;
    const err = $('#err-ship');
    if (!state.quote || state.quote === 'loading') { requestQuote(); return false; }
    if (!state.quote.available) {
      if (err) err.textContent = 'Sem cotação de frete não é possível concluir a entrega pelo site.';
      return false;
    }
    if (!state.shipping) { err.textContent = 'Escolha uma opção de frete.'; const r = $('input[name="ship"]'); if (r) r.focus(); return false; }
    return true;
  }

  /* ---------- Etapa 4: resumo e pagamento ---------- */
  function addressLine() {
    const v = (fid) => $(`#${fid}`).value.trim();
    return `${v('a-street')}, ${v('a-number')}${v('a-complement') ? ` — ${v('a-complement')}` : ''} · ${v('a-district')} · ${v('a-city')} — ${v('a-state')} · CEP ${LC.mask.cep(v('a-cep'))}`;
  }

  function deliveryBlock() {
    if (state.method === 'retirada') {
      const s = pickupStores.find((x) => x.id === state.storeId);
      return s ? `<strong>Retirada na ${esc(s.name)}</strong><span>${esc(s.address)} · ${esc(s.district)}</span>` : '';
    }
    return `<strong>Entrega: ${esc(state.shipping.company)} ${esc(state.shipping.service)}</strong><span>${esc(addressLine())}</span><span>${esc(LC.shipping.deliveryText(state.shipping.days))} após a postagem</span>`;
  }

  async function renderReview() {
    const total = renderSummary();
    $('#review').innerHTML = `
      <div class="review-items">
        ${items.map((i) => {
          const p = LC.byId(i.id);
          const img = LC.mainImage(p, i.color);
          return `<div class="review-item"><img src="${esc(img.src)}" alt="" width="54" height="68"><span>${esc(p.name)}<small>Tamanho: ${esc(i.size)}${i.color ? ` / Cor: ${esc(i.color)}` : ''} · Qtd: ${i.qty}</small></span><strong>${money(LC.unitPrice(p) * i.qty)}</strong></div>`;
        }).join('')}
      </div>
      <dl class="summary__rows" style="margin-top:1rem">
        <div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>
        <div><dt>Frete</dt><dd>${state.method === 'retirada' ? 'Grátis (retirada)' : money(shippingCost())}</dd></div>
      </dl>
      <div class="summary__total" style="margin:.7rem 0 1rem"><span>Total</span><strong>${money(total)}</strong></div>
      <div class="review-block"><strong>${esc($('#c-name').value)}</strong><span>${esc($('#c-email').value)} · ${esc($('#c-phone').value)}</span></div>
      <div class="review-block" style="margin-top:.5rem">${deliveryBlock()}</div>`;
    $('#payment-box').innerHTML = '<p class="muted small" role="status">Verificando pagamento…</p>';
    state.integrations = state.integrations || await LC.integrations();
    renderPayButton();
  }

  function renderPayButton() {
    const box = $('#payment-box');
    if (!state.integrations || state.step !== 4) return;
    const total = subtotal + (shippingCost() || 0);
    if (state.integrations.payments) {
      if (!$('#pay-btn')) {
        box.innerHTML = `
          <label class="check check--consent"><input type="checkbox" id="terms"><span>Li e concordo com as <a href="${LC.url('informacoes.html#trocas')}" target="_blank">condições de compra</a> e a <a href="${LC.url('informacoes.html#privacidade')}" target="_blank">política de privacidade</a>.</span></label>
          <p class="field__error" id="err-pay" role="alert"></p>
          <button class="btn btn--solid btn--lg btn--block" type="button" id="pay-btn"></button>
          <p class="small muted">Você será levada ao ambiente seguro do Mercado Pago para concluir o pagamento. Este site não recebe nem armazena dados de cartão.</p>`;
        $('#pay-btn').addEventListener('click', startPayment);
      }
      $('#pay-btn').textContent = state.pay ? `Finalizar pedido · ${money(total)}` : 'Finalizar pedido';
      return;
    }
    box.innerHTML = `
      <button class="btn btn--block btn--lg" type="button" disabled>Finalizar pedido</button>
      <div class="notice notice--warn">
        <p><strong>Pagamento online ainda não ativado.</strong> A integração com o Mercado Pago depende de credenciais que a loja ainda não configurou. Nenhuma cobrança foi feita e nenhum pedido foi registrado.</p>
        <p>Para comprar agora, envie este pedido para a loja e combine o pagamento diretamente:</p>
        ${LC.shipping.contactHtml(orderMessage({ withAddress: state.method === 'entrega' }))}
        <button type="button" class="link-btn small" id="copy-order">Copiar resumo do pedido</button>
      </div>`;
    $('#copy-order').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(orderMessage({ withAddress: state.method === 'entrega' })); LC.toast('Resumo copiado.'); } catch (_) { LC.toast('Não foi possível copiar automaticamente.'); }
    });
  }

  function orderMessage({ withAddress } = {}) {
    const lines = items.map((i) => {
      const p = LC.byId(i.id);
      return `• ${i.qty}x ${p.name}${i.color ? ` — ${i.color}` : ''}, tam. ${i.size} — ${money(LC.unitPrice(p) * i.qty)}`;
    });
    const name = $('#c-name').value.trim();
    let delivery = '';
    if (state.method === 'retirada') {
      const s = pickupStores.find((x) => x.id === state.storeId);
      delivery = s ? `\nRetirada: ${s.name}` : '';
    } else if (withAddress && $('#a-cep').value) {
      delivery = `\nEntrega para: ${addressLine()}`;
    }
    const pay = state.pay ? `\nPagamento desejado: ${PAY_LABEL[state.pay]}` : '';
    return `Olá, ${CFG.storeName}! ${name ? `Sou ${name} e g` : 'G'}ostaria de fazer este pedido pelo site:\n\n${lines.join('\n')}\n\nSubtotal: ${money(subtotal)}${delivery}${pay}`;
  }

  async function startPayment() {
    const btn = $('#pay-btn');
    const err = $('#err-pay');
    if (!state.pay) { $('#err-pay-method').textContent = 'Escolha a forma de pagamento.'; $('input[name="pay"]').focus(); return; }
    if (!$('#terms').checked) { err.textContent = 'Confirme que leu as condições de compra.'; $('#terms').focus(); return; }
    err.textContent = '';
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Preparando pagamento seguro…';

    const v = (fid) => $(`#${fid}`).value.trim();
    const payload = {
      source: isBuyNow ? 'comprar-agora' : 'carrinho',
      paymentMethod: state.pay,
      items: items.map(({ id, color, size, qty }) => ({ id, color, size, qty })),
      customer: { name: v('c-name'), email: v('c-email'), phone: LC.digits(v('c-phone')), cpf: LC.digits(v('c-cpf')) },
      delivery: state.method === 'retirada'
        ? { method: 'retirada', storeId: state.storeId }
        : {
            method: 'entrega',
            serviceId: state.shipping.id,
            address: { cep: LC.digits(v('a-cep')), street: v('a-street'), number: v('a-number'), complement: v('a-complement'), district: v('a-district'), city: v('a-city'), state: v('a-state') }
          }
    };

    try {
      const res = await LC.api('/checkout', { method: 'POST', body: payload });
      const target = new URL(String(res.checkoutUrl || ''));
      const hosts = CFG.allowedCheckoutHosts || [];
      if (target.protocol !== 'https:' || !hosts.some((h) => target.hostname === h || target.hostname.endsWith(`.${h}`))) {
        throw new Error('Endereço de pagamento não reconhecido. Tente novamente.');
      }
      LC.store.set(LAST_ORDER_KEY, { id: res.orderId, key: res.accessKey, source: payload.source, createdAt: Date.now() });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch (_) { /* ignora */ }
      location.assign(target.href);
    } catch (e) {
      err.textContent = e.message || 'Não foi possível iniciar o pagamento.';
      btn.disabled = false;
      btn.textContent = label;
      if (e.status === 409) { state.quote = null; state.shipping = null; }
    }
  }

  /* ---------- Resumo recolhível no celular ---------- */
  const toggle = $('#summary-toggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    $('#order-summary').classList.toggle('is-open', open);
  });

  /* ---------- Início ---------- */
  loadDraft();
  renderPickup();
  renderQuote();
  goTo(1, { focus: false });
  LC.integrations().then((s) => { state.integrations = s; });
})();
