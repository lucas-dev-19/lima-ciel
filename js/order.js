/* ==========================================================
   Retorno do pagamento (pedido.html?pedido=ID&retorno=...).
   O parâmetro "retorno" vem do navegador e NÃO confirma nada:
   o status exibido é o que o backend recebeu pelo webhook validado.
   Depende de: utils.js, cart.js, main.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { ICON, $, esc, money } = LC;
  const root = $('#order-root');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const orderId = params.get('pedido') || '';
  const last = LC.store.get('limaciel.lastOrder', null);
  const key = last && last.id === orderId ? last.key : '';
  const store = LC.CFG.storeName;

  const STATUS = {
    pago: { icon: 'check', title: 'Pedido realizado com sucesso!', text: `Obrigado por comprar na ${store}. Seu pagamento foi confirmado e em breve você receberá mais informações por e-mail.`, tone: 'ok' },
    aguardando_pagamento: { icon: 'clock', title: 'Aguardando confirmação do pagamento', text: 'Ainda não recebemos a confirmação do Mercado Pago. Se você pagou com Pix, ela costuma chegar em instantes — esta página se atualiza sozinha.', tone: 'wait' },
    pagamento_em_analise: { icon: 'clock', title: 'Pagamento em análise', text: 'O Mercado Pago está analisando o pagamento. Você receberá a resposta por e-mail.', tone: 'wait' },
    pagamento_recusado: { icon: 'alert', title: 'Pagamento não aprovado', text: 'O pagamento não foi aprovado. Seu carrinho foi mantido para você tentar novamente com outra forma de pagamento.', tone: 'bad' },
    cancelado: { icon: 'alert', title: 'Pagamento cancelado', text: 'O pagamento foi cancelado. Seu carrinho foi mantido.', tone: 'bad' },
    estornado: { icon: 'alert', title: 'Pagamento estornado', text: 'Este pagamento foi devolvido. Em caso de dúvida, fale com a loja.', tone: 'bad' },
    divergencia_de_valor: { icon: 'clock', title: 'Pagamento em verificação', text: 'A loja vai conferir este pagamento e entrará em contato.', tone: 'wait' },
    falha_ao_iniciar_pagamento: { icon: 'alert', title: 'Pagamento não iniciado', text: 'Houve uma falha ao abrir o pagamento. Seu carrinho foi mantido.', tone: 'bad' }
  };

  function view({ icon, title, text, tone }, order) {
    root.innerHTML = `
      <div class="confirm panel${tone === 'bad' ? ' confirm--bad' : ''}">
        ${ICON.leaf}
        <span class="confirm__icon">${ICON[icon]}</span>
        <h1>${title}</h1>
        <p>${text}</p>
        ${orderId ? `<p class="small muted">Pedido ${esc(orderId)}</p>` : ''}
        ${order ? `
          <ul class="order-items">${order.items.map((i) => `<li>${i.qty}× ${esc(i.name)}${i.color ? ` · ${esc(i.color)}` : ''} · Tam. ${esc(i.size)}</li>`).join('')}</ul>
          <p class="small">Total: <strong>${money(order.total)}</strong> · ${order.delivery === 'retirada' ? 'Retirada na loja' : 'Entrega'}</p>` : ''}
        <div class="cart-empty__actions">
          ${tone === 'bad' ? `<a class="btn btn--solid" href="${LC.url('carrinho.html')}">Voltar ao carrinho</a>` : `<a class="btn btn--solid" href="${LC.url('produtos.html')}">Voltar para a loja</a>`}
        </div>
      </div>`;
  }

  async function poll(attempt = 0) {
    let order;
    try {
      order = await LC.api(`/orders/${encodeURIComponent(orderId)}?key=${encodeURIComponent(key)}`);
    } catch (_) {
      view(STATUS.aguardando_pagamento);
      return;
    }
    view(STATUS[order.status] || STATUS.aguardando_pagamento, order);
    if (order.status === 'pago') {
      if (last.source === 'carrinho') LC.cart.clear(); else LC.buyNow.clear();
      return;
    }
    const waiting = order.status === 'aguardando_pagamento' || order.status === 'pagamento_em_analise';
    if (waiting && attempt < 20) setTimeout(() => poll(attempt + 1), attempt < 5 ? 3000 : 8000);
  }

  if (!orderId || !key) {
    view({ icon: 'clock', title: 'Acompanhe seu pedido', text: 'Não encontramos os dados deste pedido neste navegador. A confirmação oficial do pagamento é enviada pelo Mercado Pago para o seu e-mail.', tone: 'wait' });
    return;
  }
  view({ icon: 'clock', title: 'Verificando pagamento…', text: 'Aguarde um instante.', tone: 'wait' });
  poll();
})();
