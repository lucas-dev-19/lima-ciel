/* ==========================================================
   Página do carrinho (carrinho.html).
   Depende de: utils.js, cart.js, main.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { ICON, $, esc, money } = LC;
  const root = $('#cart-root');
  if (!root) return;

  function render() {
    const items = LC.cart.items();
    if (!items.length) {
      root.innerHTML = `
        <div class="cart-empty">
          ${ICON.bag}
          <h1>Seu carrinho está vazio</h1>
          <p>Que tal conhecer as novidades da semana?</p>
          <div class="cart-empty__actions">
            <a class="btn btn--solid" href="${LC.url('categorias/novidades.html')}">Ver novidades ${ICON.arrowRight}</a>
            <a class="btn btn--line" href="${LC.url('produtos.html')}">Ver todas as roupas</a>
          </div>
        </div>`;
      return;
    }

    const problems = new Map(LC.cart.problems().map((x) => [x.key, x]));
    const count = LC.cart.count();
    const subtotal = LC.cart.subtotal();

    root.innerHTML = `
      <div class="cart-head">
        <h1>Seu carrinho <span class="muted" style="font-size:.6em">(${count} ${count === 1 ? 'item' : 'itens'})</span></h1>
        <a class="link-more" href="${LC.url('produtos.html')}">${ICON.arrowLeft} Continuar comprando</a>
      </div>
      <div class="cart-layout">
        <ul class="cart-list panel">
          ${items.map((i) => line(i, problems.get(LC.cart.keyOf(i)))).join('')}
        </ul>

        <aside class="summary panel" aria-labelledby="sum-title">
          <h2 id="sum-title">Resumo do pedido</h2>
          <dl class="summary__rows">
            <div><dt>Subtotal</dt><dd>${money(subtotal)}</dd></div>
            <div><dt>Frete</dt><dd class="muted">Calculado na finalização</dd></div>
          </dl>
          <div class="summary__total"><span>Total</span><strong>${money(subtotal)}</strong></div>
          ${problems.size ? '<p class="form-error">Ajuste os itens marcados para finalizar o pedido.</p>' : ''}
          <a class="btn btn--solid btn--block btn--lg${problems.size ? ' is-disabled' : ''}" href="${LC.url('checkout.html')}" id="go-checkout" ${problems.size ? 'aria-disabled="true"' : ''}>Finalizar pedido ${ICON.arrowRight}</a>
          <a class="btn btn--line btn--block" href="${LC.url('produtos.html')}">Continuar comprando</a>
          <p class="summary__note">${ICON.lock} Pagamento seguro pelo Mercado Pago</p>
        </aside>
      </div>
      <ul class="trust">
        <li class="panel">${ICON.lock}<span>Compra segura</span></li>
        <li class="panel">${ICON.truck}<span>Entrega para todo o Brasil</span></li>
        <li class="panel">${ICON.store}<span>Retirada sem frete na loja</span></li>
      </ul>`;
  }

  function line(i, problem) {
    const p = LC.byId(i.id);
    const k = esc(LC.cart.keyOf(i));
    const img = LC.mainImage(p, i.color);
    const available = LC.stockOf(p, i.color, i.size);
    const max = Math.max(1, Math.min(LC.MAX_QTY, available));
    const unit = LC.unitPrice(p);
    const warn = problem
      ? `<p class="line-warn">${problem.type === 'esgotado' ? 'Esgotado: remova para continuar.' : `Só ${problem.available} disponível(is). Ajuste a quantidade.`}</p>`
      : '';
    return `
      <li class="cart-item${problem ? ' has-problem' : ''}">
        <a class="cart-item__img" href="${LC.productUrl(p)}"><img src="${esc(img.src)}" alt="${esc(p.name)}" width="160" height="200" loading="lazy"></a>
        <div class="cart-item__info">
          <h2 class="cart-item__name"><a href="${LC.productUrl(p)}">${esc(p.name)}</a></h2>
          <p class="cart-item__meta">Tamanho: ${esc(i.size)}${i.color ? ` / Cor: ${esc(i.color)}` : ''}${p.demo ? ' · Demonstrativo' : ''}</p>
          <p class="cart-item__unit">${LC.onSale(p) ? `<s>${money(p.price)}</s>` : ''}${money(unit)}</p>
          ${warn}
          <div class="qty" role="group" aria-label="Quantidade de ${esc(p.name)}">
            <button type="button" data-dec="${k}" aria-label="Diminuir" ${i.qty <= 1 ? 'disabled' : ''}>−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-inc="${k}" aria-label="Aumentar" ${i.qty >= max ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="cart-item__side">
          <button type="button" class="cart-item__rm" data-rm="${k}" aria-label="Remover ${esc(p.name)}">${ICON.close}</button>
          <p class="cart-item__total">${money(unit * i.qty)}</p>
        </div>
      </li>`;
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) {
      const key = b.dataset.rm || b.dataset.dec || b.dataset.inc;
      if (!key) return;
      const item = LC.cart.items().find((i) => LC.cart.keyOf(i) === key);
      if (!item) return;
      if (b.dataset.rm) {
        LC.cart.remove(key);
        LC.toast(`${esc(LC.byId(item.id).name)} removido do carrinho.`);
        return;
      }
      LC.cart.setQty(key, item.qty + (b.dataset.inc ? 1 : -1));
      const attr = b.dataset.inc ? 'data-inc' : 'data-dec';
      const again = [...root.querySelectorAll(`[${attr}]`)].find((x) => x.getAttribute(attr) === key);
      if (again && !again.disabled) again.focus();
      return;
    }
    if (e.target.closest('#go-checkout[aria-disabled="true"]')) e.preventDefault();
  });

  LC.cart.onChange(render);
  render();
})();
