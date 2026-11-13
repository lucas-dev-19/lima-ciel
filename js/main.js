/* ==========================================================
   Estrutura comum: ícones, cabeçalho (com submenu de categorias),
   gaveta e barra inferior no celular, busca, rodapé, contador do
   carrinho e o cartão de produto usado nas vitrines.
   Depende de: utils.js, cart.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;
  const { CFG, CATEGORIES, $, esc, money, url } = LC;
  const brand = esc(CFG.storeName || 'Lima Ciel');

  const svg = (d) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    menu: svg('<path d="M3 7h18M3 12h18M3 17h18"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    bag: svg('<path d="M5 8h14l-1.1 12.2a1 1 0 0 1-1 .8H7.1a1 1 0 0 1-1-.8L5 8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>'),
    home: svg('<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/>'),
    shop: svg('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
    instagram: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
    whatsapp: svg('<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z"/><path d="M9 9c.3 2.6 2.4 4.7 5 5l1.3-1.3-2-1-.8.8c-.8-.4-1.5-1.1-1.9-1.9l.8-.8-1-2L9 9z"/>'),
    arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    arrowLeft: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    chevDown: svg('<path d="M6 9l6 6 6-6"/>'),
    chevRight: svg('<path d="M9 6l6 6-6 6"/>'),
    truck: svg('<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>'),
    store: svg('<path d="M4 9.5L5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 11.5V20h13v-8.5"/><path d="M10 20v-4.5h4V20"/>'),
    exchange: svg('<path d="M4 9h13l-3-3M20 15H7l3 3"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    shield: svg('<path d="M12 3l7 3v5.5c0 4.3-3 7.8-7 9.5-4-1.7-7-5.2-7-9.5V6l7-3z"/><path d="M9 12l2 2 4-4"/>'),
    pix: svg('<path d="M12 3.5l3.6 3.6a2 2 0 0 0 1.4.6h1.5L20.5 9.7a3.2 3.2 0 0 1 0 4.6l-2 2H17a2 2 0 0 0-1.4.6L12 20.5l-3.6-3.6A2 2 0 0 0 7 16.3H5.5l-2-2a3.2 3.2 0 0 1 0-4.6l2-2H7a2 2 0 0 0 1.4-.6L12 3.5z"/>'),
    card: svg('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    pin: svg('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
    alert: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>'),
    trash: svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>'),
    filter: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    bell: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    leaf: '<svg class="confirm__leaf" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M30 190C80 150 130 90 170 20"/><path d="M60 162c-18-8-30-26-28-46 20 4 32 22 28 46zM84 138c-16-12-22-32-16-50 18 8 24 28 16 50zM108 110c-12-14-14-34-4-50 16 12 16 32 4 50zM130 80c-8-16-6-34 6-48 12 14 8 34-6 48zM60 162c14-14 34-18 52-10-12 16-32 20-52 10zM86 136c14-12 34-14 50-4-14 14-34 16-50 4zM110 108c12-12 30-14 46-6-12 14-30 16-46 6z"/></svg>'
  };
  LC.ICON = ICON;

  const NAV = [
    { key: 'inicio', label: 'Início', href: 'index.html' },
    { key: 'categorias', label: 'Categorias', children: [
      ...CATEGORIES.map((c) => ({ key: c.slug, label: c.name, href: `categorias/${c.slug}.html` })),
      { key: 'loja', label: 'Ver todas as roupas', href: 'produtos.html' }
    ] },
    { key: 'novidades', label: 'Novidades', href: 'categorias/novidades.html' },
    { key: 'promocoes', label: 'Promoções', href: 'categorias/promocoes.html' },
    { key: 'sobre', label: 'Sobre', href: 'sobre.html' }
  ];
  LC.NAV = NAV;

  /* ---------- Cabeçalho ---------- */
  function renderHeader() {
    const host = $('#site-header');
    if (!host) return;
    const current = document.body.dataset.nav || '';
    const demo = CFG.demoMode ? '<p class="demo-bar">Loja em demonstração — produtos, preços e fotos são ilustrativos até a chegada do catálogo oficial.</p>' : '';

    if (document.body.dataset.layout === 'checkout') {
      host.outerHTML = `${demo}
        <header class="site-header">
          <div class="site-header__bar">
            <a class="wordmark" href="${url('index.html')}" aria-label="${brand} — página inicial">${brand}</a>
            <p class="header-actions co-secure">${ICON.lock}<span>Compra 100% segura</span></p>
          </div>
        </header>`;
      return;
    }

    const isCurrent = (n) => n.key === current || (n.children || []).some((c) => c.key === current);
    const items = NAV.map((n) => {
      if (n.children) {
        return `<li>
          <button class="nav-sub-toggle" type="button" aria-expanded="false" aria-controls="nav-sub-${n.key}">${esc(n.label)} ${ICON.chevDown}</button>
          <ul class="nav-sub" id="nav-sub-${n.key}" hidden>
            ${n.children.map((c) => `<li><a href="${url(c.href)}"${c.key === current ? ' aria-current="page"' : ''}>${esc(c.label)}</a></li>`).join('')}
          </ul>
        </li>`;
      }
      return `<li><a href="${url(n.href)}"${isCurrent(n) ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`;
    }).join('');

    host.outerHTML = `${demo}
      <header class="site-header" id="topo">
        <div class="site-header__bar">
          <button class="icon-btn menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menu">${ICON.menu}</button>
          <a class="wordmark" href="${url('index.html')}" aria-label="${brand} — página inicial">${brand}</a>
          <nav class="main-nav" id="main-nav" aria-label="Principal">
            <div class="main-nav__head">
              <span class="wordmark">${brand}</span>
              <button class="icon-btn" type="button" id="menu-close" aria-label="Fechar menu">${ICON.close}</button>
            </div>
            <ul class="main-nav__list">${items}</ul>
            <div class="main-nav__extra">
              ${CFG.instagram && CFG.instagram.url ? `<a href="${esc(CFG.instagram.url)}" target="_blank" rel="noopener noreferrer">${ICON.instagram}<span>@${esc(CFG.instagram.handle)}</span></a>` : ''}
            </div>
          </nav>
          <div class="header-actions">
            <button class="icon-btn" id="search-toggle" aria-expanded="false" aria-controls="search-panel" aria-label="Pesquisar">${ICON.search}</button>
            <a class="icon-btn cart-link" href="${url('carrinho.html')}" id="cart-link" aria-label="Carrinho">
              ${ICON.bag}<span class="cart-count" data-cart-count hidden>0</span>
            </a>
          </div>
        </div>
        <div class="search-panel" id="search-panel" hidden>
          <form class="search-form" action="${url('produtos.html')}" method="get" role="search">
            <label class="sr-only" for="header-search">Pesquisar produtos</label>
            <div class="input-icon">${ICON.search}<input class="input" id="header-search" name="busca" type="search" placeholder="Buscar produtos…" autocomplete="off" required></div>
            <button class="btn btn--solid" type="submit">Buscar</button>
          </form>
        </div>
      </header>
      <div class="nav-scrim" id="nav-scrim" hidden></div>
      <nav class="bottom-nav" aria-label="Atalhos">
        <a href="${url('index.html')}"${current === 'inicio' ? ' aria-current="page"' : ''}>${ICON.home}<span>Início</span></a>
        <a href="${url('produtos.html')}"${current === 'loja' || CATEGORIES.some((c) => c.slug === current) ? ' aria-current="page"' : ''}>${ICON.shop}<span>Loja</span></a>
        <button type="button" id="bottom-search">${ICON.search}<span>Buscar</span></button>
        <a href="${url('carrinho.html')}"${current === 'carrinho' ? ' aria-current="page"' : ''}>${ICON.bag}<span>Carrinho</span><span class="cart-count" data-cart-count hidden>0</span></a>
      </nav>`;
    document.body.classList.add('has-bottom-nav');
  }

  function setupHeader() {
    if (document.body.dataset.layout === 'checkout') return;
    const nav = $('#main-nav');
    const btn = $('#menu-toggle');
    const scrim = $('#nav-scrim');
    if (!nav || !btn) return;
    const desktop = matchMedia('(min-width: 961px)');

    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      scrim.hidden = !open;
      document.body.classList.toggle('no-scroll', open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) $('#menu-close').focus(); else if (!desktop.matches) btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', () => setMenu(true));
    $('#menu-close').addEventListener('click', () => setMenu(false));
    scrim.addEventListener('click', () => setMenu(false));
    desktop.addEventListener('change', (e) => { if (e.matches && nav.classList.contains('is-open')) setMenu(false); });

    /* Submenu "Categorias": clique (toque) e teclado; fecha ao clicar fora */
    const subBtn = nav.querySelector('.nav-sub-toggle');
    const sub = nav.querySelector('.nav-sub');
    const setSub = (open) => { subBtn.setAttribute('aria-expanded', String(open)); sub.hidden = !open; };
    subBtn.addEventListener('click', () => setSub(sub.hidden));
    const subItem = subBtn.parentElement;
    subItem.addEventListener('mouseenter', () => { if (desktop.matches) setSub(true); });
    subItem.addEventListener('mouseleave', () => { if (desktop.matches) setSub(false); });
    document.addEventListener('click', (e) => { if (desktop.matches && !sub.hidden && !e.target.closest('.nav-sub, .nav-sub-toggle')) setSub(false); });

    const sBtn = $('#search-toggle');
    const panel = $('#search-panel');
    const setSearch = (open) => {
      panel.hidden = !open;
      sBtn.setAttribute('aria-expanded', String(open));
      if (open) { window.scrollTo({ top: 0 }); $('#header-search').focus(); }
    };
    sBtn.addEventListener('click', () => setSearch(panel.hidden));
    $('#bottom-search').addEventListener('click', () => setSearch(true));

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (nav.classList.contains('is-open')) setMenu(false);
      if (!sub.hidden) { setSub(false); subBtn.focus(); }
      if (!panel.hidden) { setSearch(false); sBtn.focus(); }
    });
  }

  function updateCartBadge() {
    const n = LC.cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((b) => { b.textContent = n > 99 ? '99+' : n; b.hidden = n === 0; });
    const link = $('#cart-link');
    if (link) link.setAttribute('aria-label', `Carrinho, ${n} ${n === 1 ? 'item' : 'itens'}`);
  }

  /* ---------- Rodapé ---------- */
  function renderFooter() {
    const host = $('#site-footer');
    if (!host) return;
    const storesHtml = LC.stores().map((s) => {
      const wa = LC.waLink(s.whatsapp, `Olá, ${CFG.storeName}! Vim pelo site.`);
      return `<li class="footer-store">
        <strong>${esc(s.name)}</strong>
        <span>${esc(s.address)}</span>
        <span>${esc([s.district, s.city].filter(Boolean).join(' · '))}</span>
        ${s.openingHours ? `<span>${esc(s.openingHours)}</span>` : ''}
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp ${esc(s.phone || '')}</a>` : ''}
      </li>`;
    }).join('');
    const socials = [
      CFG.instagram && CFG.instagram.url ? `<a href="${esc(CFG.instagram.url)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${ICON.instagram}</a>` : '',
      ...LC.stores().slice(0, 1).map((s) => (LC.waLink(s.whatsapp) ? `<a href="${LC.waLink(s.whatsapp)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${ICON.whatsapp}</a>` : ''))
    ].join('');

    host.outerHTML = `
      <footer class="site-footer">
        <div class="site-footer__inner">
          <div class="footer-brand">
            <a class="wordmark" href="${url('index.html')}">${brand}</a>
            <p>${esc(CFG.tagline || '')}</p>
            <div class="footer-social">${socials}</div>
          </div>
          <nav aria-label="Comprar">
            <h2 class="footer-title">Comprar</h2>
            <ul>
              <li><a href="${url('categorias/novidades.html')}">Novidades</a></li>
              ${CATEGORIES.map((c) => `<li><a href="${url(`categorias/${c.slug}.html`)}">${esc(c.name)}</a></li>`).join('')}
              <li><a href="${url('categorias/promocoes.html')}">Promoções</a></li>
            </ul>
          </nav>
          <nav aria-label="Ajuda">
            <h2 class="footer-title">Ajuda</h2>
            <ul>
              <li><a href="${url('sobre.html')}">Sobre a loja</a></li>
              <li><a href="${url('informacoes.html#como-comprar')}">Como comprar</a></li>
              <li><a href="${url('informacoes.html#entrega')}">Entrega e retirada</a></li>
              <li><a href="${url('informacoes.html#pagamento')}">Pagamento</a></li>
              <li><a href="${url('informacoes.html#trocas')}">Trocas e devoluções</a></li>
              <li><a href="${url('informacoes.html#privacidade')}">Privacidade</a></li>
              <li><a href="${url('informacoes.html#creditos')}">Créditos das imagens</a></li>
            </ul>
          </nav>
          <div>
            <h2 class="footer-title">Nossas lojas</h2>
            <ul class="footer-stores">${storesHtml || '<li>Endereços em breve.</li>'}</ul>
          </div>
        </div>
        <div class="site-footer__base">
          <p>© ${new Date().getFullYear()} ${brand}. Todos os direitos reservados.</p>
          <p>Pagamentos processados pelo Mercado Pago. Este site não armazena dados de cartão.</p>
        </div>
      </footer>`;
  }

  /* ---------- Cartão de produto ---------- */
  function card(p, { eager = false } = {}) {
    const imgs = LC.imagesFor(p, LC.defaultColor(p));
    const first = imgs[0] || { src: '', alt: p.name };
    const second = imgs[1];
    const soldOut = LC.isSoldOut(p);
    const tags = [
      soldOut ? '<span class="tag tag--soldout">Esgotado</span>' : '',
      !soldOut && LC.onSale(p) ? `<span class="tag tag--sale">−${LC.discountPct(p)}%</span>` : '',
      !soldOut && p.isNew ? '<span class="tag">Novo</span>' : ''
    ].join('');
    const price = LC.onSale(p)
      ? `<span class="price__old"><span class="sr-only">De </span>${money(p.price)}</span> <span class="price__now"><span class="sr-only">por </span>${money(p.promoPrice)}</span>`
      : `<span class="price__now">${money(p.price)}</span>`;
    const colors = (p.colors || []).length > 1
      ? `<ul class="swatches" aria-label="Cores: ${esc(p.colors.map((c) => c.name).join(', '))}">${p.colors.map((c) => `<li class="swatch" style="--sw:${LC.safeColor(c.hex)}" title="${esc(c.name)}"></li>`).join('')}</ul>`
      : '';
    return `
      <article class="card${soldOut ? ' is-soldout' : ''}">
        <a class="card__media" href="${LC.productUrl(p)}" tabindex="-1" aria-hidden="true">
          <img src="${esc(first.src)}" alt="" width="800" height="1000" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
          ${second ? `<img class="card__alt" src="${esc(second.src)}" alt="" width="800" height="1000" loading="lazy" decoding="async">` : ''}
          <span class="card__tags">${tags}</span>
          ${p.demo ? '<span class="illus">Imagem ilustrativa</span>' : ''}
        </a>
        <div class="card__body">
          <h3 class="card__title"><a href="${LC.productUrl(p)}">${esc(p.name)}</a></h3>
          <p class="price">${price}</p>
          ${colors}
        </div>
      </article>`;
  }
  LC.card = card;

  renderHeader();
  renderFooter();
  setupHeader();
  updateCartBadge();
  LC.cart.onChange(updateCartBadge);
})();
