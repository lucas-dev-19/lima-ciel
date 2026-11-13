# Lima Ciel — loja virtual

Loja virtual de moda feminina em HTML, CSS e JavaScript puro, sem frameworks e sem etapa de build. Um backend em Node.js, também sem dependências, cuida de frete, pagamentos e webhooks.

Visual minimalista e feminino: fundo creme, painéis claros, títulos em Gilda Display, texto em Jost, botões café e o vinho da marca nos detalhes.

> **Nome da marca:** no Instagram [@limacielrio](https://www.instagram.com/limacielrio/), o perfil aparece como "Li Maciel". O site usa "Lima Ciel", como nos layouts de referência. Para trocar, altere `storeName` em `js/config.js` e os `<title>` das páginas HTML.

## Estrutura

```
/
├── index.html            Página inicial (banner, coleções, novidades, a marca, mais procurados, Instagram)
├── produtos.html         Catálogo completo (filtros laterais, pesquisa, ordenação, paginação)
├── produto.html          Detalhes do produto (?id=...)
├── carrinho.html         Carrinho
├── checkout.html         Finalização em 4 telas: identificação → entrega ou retirada → endereço/loja → resumo e pagamento
├── pedido.html           Retorno do Mercado Pago (status confirmado pelo webhook)
├── sobre.html            Sobre a loja (lojas físicas, numeração, Instagram)
├── informacoes.html      Como comprar, entrega, pagamento, trocas, privacidade, créditos
├── 404.html
├── categorias/           vestidos, blusas, calcas, saias, conjuntos, novidades, promocoes
├── css/
│   ├── style.css         Identidade visual e componentes (mobile first)
│   └── responsive.css    Tablets e desktops
├── js/
│   ├── config.js         Configurações PÚBLICAS (lojas, Instagram, embalagem, backend)
│   ├── products.js       Catálogo e coleções (edite aqui)
│   ├── utils.js          Utilidades compartilhadas
│   ├── cart.js           Carrinho (localStorage) e "Comprar agora"
│   ├── main.js           Cabeçalho, menu, rodapé, cartão de produto
│   ├── home.js           Página inicial
│   ├── catalog.js        Catálogo e categorias
│   ├── product.js        Página de produto
│   ├── cart-page.js      Página do carrinho
│   ├── shipping.js       ViaCEP e cotação de frete (via backend)
│   ├── checkout.js       Checkout
│   ├── order.js          Página de retorno do pagamento
│   ├── about.js          Página "Sobre"
│   └── credits.js        Créditos das imagens
├── assets/
│   ├── images/catalog/   Fotos (hoje: ilustrativas de bancos de imagens, ver manifest.json)
│   └── icons/
└── backend/
    ├── server.js         Servidor HTTP e rotas da API (também serve o site localmente)
    ├── env.js            Leitura das variáveis de ambiente
    ├── catalog.js        Preço, estoque e validação dos itens no servidor
    ├── shipping.js       Cotação de frete — Melhor Envio
    ├── payments.js       Mercado Pago Checkout Pro
    ├── webhooks.js       Webhook do Mercado Pago com validação de assinatura
    ├── orders.js         Pedidos e avisos de reposição (arquivos JSON)
    ├── tests/            Testes automatizados (node --test)
    └── .env.example      Modelo das variáveis secretas
```

A versão anterior do site, de página única, ficou guardada sem alterações em `lima-ciel/lima-ciel/` no computador de origem. Ela não faz parte deste repositório.

## 1. Rodar localmente

É preciso ter o Node.js 20.12 ou mais recente.

```bash
node backend/server.js
# abra http://localhost:3000
```

O backend serve o site e a API no mesmo endereço. Sem nenhuma credencial configurada, o site funciona inteiro: catálogo, carrinho, checkout e consulta de CEP. Ficam desativados, com aviso claro na tela:

- **Frete:** aparece "Cotação de frete indisponível", com opção de retirar na loja ou falar com a loja.
- **Pagamento:** aparece "Pagamento online ainda não ativado", com opção de enviar o pedido pelo WhatsApp de uma das lojas.

Nada é simulado. Não existe frete fixo nem aprovação de pagamento falsa.

Testes do backend:

```bash
node --test "backend/tests/*.test.js"
```

## 2. Produtos

Edite `js/products.js`. **Todos os produtos atuais são demonstrativos** (`demo: true`). Eles exibem o selo "Imagem ilustrativa" e o aviso de produto demonstrativo. Troque-os pelo catálogo oficial.

```js
{
  id: "vestido-midi-linho",            // único, sem acentos (vira produto.html?id=...)
  name: "Vestido Midi de Linho",
  category: "Vestidos",                // Vestidos | Blusas | Calças | Saias | Conjuntos
  collection: "linho-e-leveza",        // opcional, slug de LIMA_CIEL_COLLECTIONS
  price: 489.9,
  promoPrice: 389.9,                   // ou null (com valor, aparece em Promoções)
  isNew: true,                         // aparece em Novidades
  featured: true,                      // aparece em "Mais procurados"
  demo: false,                         // false nos produtos reais
  sizes: ["38", "40", "42", "44", "46", "48", "50"],
  colors: [{ name: "Off-white", hex: "#F1EBDD" }],
  stock: { "38": 2, "40": 0, ... },    // por tamanho; com várias cores: { "Off-white": { "38": 2 }, "Preto": {...} }
  weightKg: 0.45,                      // opcional (frete); senão usa o padrão do config.js
  description: "Texto da peça.",
  details: ["Comprimento midi", "Forro em viscose"],
  care: "Lavar à mão.",                // opcional
  images: [
    { src: "assets/images/catalog/vestido-1.jpg", alt: "Modelo usando o vestido, de frente" },
    { src: "assets/images/catalog/vestido-2.jpg", alt: "Detalhe do tecido" }
    // com várias cores, acrescente color: "Off-white" em cada foto
  ]
}
```

- **Esgotado:** com o estoque de todos os tamanhos em `0`, o produto continua visível com a etiqueta "Esgotado", e os botões de compra ficam desativados.
- **Fotos:** use JPG ou WebP em proporção 4:5 (por exemplo 1200×1500), com até ~250 KB. Prefira modelos vestindo a peça, de corpo inteiro, com uma foto de detalhe.
- O backend usa este mesmo arquivo para conferir preço e estoque. **O preço enviado pelo navegador nunca é usado.**
- Em produção, o ideal é que o estoque venha de um banco de dados ou ERP, e não de um arquivo estático.

## 3. Dados da loja (`js/config.js`)

Os endereços e números de WhatsApp das lojas Freguesia e Centro foram copiados das publicações oficiais da marca no Instagram e no Linktree. **Confirme antes de publicar.** Ainda faltam:

- [ ] CEP de cada loja e horário de funcionamento (`openingHours`)
- [ ] E-mail de contato
- [ ] Instruções de retirada (`pickupInstructions`)
- [ ] Peso e medidas reais da embalagem (`shipping.defaultItemPackage`)
- [ ] `demoMode: false` quando o catálogo oficial estiver no ar
- [ ] Parcelamento exibido no produto (`installments`): só ative com as condições reais do Mercado Pago

## 4. Frete (Melhor Envio)

A cotação usa a API do [Melhor Envio](https://docs.melhorenvio.com.br/). Ela devolve os preços reais da conta da loja para Correios (PAC, SEDEX, Mini Envios) e para transportadoras (Jadlog, Loggi e outras), considerando o CEP de origem, o CEP de destino, o peso, as dimensões e o valor segurado.

1. Crie uma conta em melhorenvio.com.br. Para testar, use antes o sandbox (sandbox.melhorenvio.com.br).
2. Gere um token com permissão de cotação (`shipping-calculate`).
3. No `backend/.env`, preencha `ME_TOKEN`, `ME_ENV`, `ME_USER_AGENT` (nome do app + e-mail técnico) e `STORE_ORIGIN_CEP`.

O frete é cotado de novo no servidor no momento do pagamento. Não se usa o valor que veio do navegador.

*Alternativa:* a API oficial dos Correios (api.correios.com.br) exige contrato comercial com os Correios. O Melhor Envio dispensa o contrato e reúne várias transportadoras.

## 5. Pagamentos (Mercado Pago Checkout Pro)

O cliente paga no ambiente do Mercado Pago, com Pix e cartão de crédito ou débito, conforme o que estiver habilitado na conta. **O site nunca recebe dados de cartão**, e o Access Token fica só no backend.

1. Em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/panel/app), crie uma aplicação do tipo Checkout Pro.
2. No `backend/.env`, preencha:
   - `MP_ACCESS_TOKEN`: comece com as credenciais de teste.
   - `PUBLIC_SITE_URL`: endereço do site, usado nas URLs de retorno.
   - `PUBLIC_API_URL`: endereço público do backend **em HTTPS**, usado no webhook.
3. No painel, em **Webhooks**, cadastre `https://SEU-BACKEND/api/webhooks/mercadopago` com o evento **Pagamentos**. Copie a "assinatura secreta" para `MP_WEBHOOK_SECRET`.
4. Para que o Pix apareça, a conta precisa ter uma chave Pix cadastrada.

Fluxo:

- O checkout envia ao backend `POST /api/checkout` com os itens, os dados da cliente, a forma de entrega e a forma de pagamento escolhida (Pix, crédito ou débito). A página do Mercado Pago mostra só a forma escolhida.
- O backend:
  - recalcula preço, estoque e frete;
  - cria o pedido;
  - cria a preferência no Mercado Pago;
  - devolve o link de pagamento.
- O site só redireciona para domínios do Mercado Pago (`allowedCheckoutHosts`).
- O Mercado Pago notifica o webhook. O backend:
  - valida a assinatura HMAC (`x-signature`);
  - consulta o pagamento na API;
  - confere valor e moeda;
  - só então marca o pedido como **pago**.
- A página `pedido.html` mostra o status que o backend recebeu pelo webhook. O retorno do navegador não confirma nada.

Pedidos ficam em `backend/data/orders.json`, que contém dados pessoais e nunca deve ser versionado. Para volume maior, troque por um banco de dados mantendo as funções de `orders.js`.

## 6. "Avise-me quando voltar"

Só aparece quando o backend está ativo. O e-mail é registrado apenas com consentimento explícito (checkbox), e o texto do consentimento fica salvo junto com o registro (`backend/data/restock-alerts.json`). Sem backend, a página de produto esgotado oferece contato pelo WhatsApp ou pelo Instagram.

## 7. Publicar

- **Site + backend juntos** (mais simples): qualquer hospedagem Node.js, como Render, Railway, Fly.io ou uma VPS. Rode `node backend/server.js` com as variáveis de ambiente configuradas no painel.
- **Separados:**
  - site estático no Netlify, Cloudflare Pages ou GitHub Pages;
  - backend em hospedagem Node, com `SERVE_STATIC=false`;
  - `ALLOWED_ORIGINS` com o domínio do site;
  - `apiBaseUrl` em `js/config.js` com o endereço do backend.

Depois de publicar, troque `SEU-DOMINIO.com.br` no `index.html`.

## 8. Checklist antes de divulgar

- [ ] Confirmar o nome da marca e os dados das lojas
- [ ] Catálogo oficial em `products.js` com `demo: false` e fotos reais
- [ ] Remover as fotos ilustrativas de `assets/images/catalog/` que não forem usadas
- [ ] `demoMode: false` em `config.js`
- [ ] Frete testado no sandbox do Melhor Envio
- [ ] Pagamento e webhook testados com as credenciais de teste do Mercado Pago
- [ ] Política de trocas e responsável pela privacidade (LGPD) em `informacoes.html`
- [ ] Domínio final no `index.html`

## Créditos das imagens

As fotos de `assets/images/catalog/` são ilustrativas, de bancos de imagens gratuitos (Unsplash License ou Pexels License). A origem e o autor de cada uma estão em `assets/images/catalog/manifest.json` e na página `informacoes.html#creditos`. Elas não mostram peças da marca.
