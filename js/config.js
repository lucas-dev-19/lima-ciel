/*
 * CONFIGURAÇÕES PÚBLICAS DA LOJA
 * ---------------------------------------------------------------------------
 * Tudo aqui é visível para qualquer visitante. NUNCA coloque Access Token,
 * chaves secretas ou senhas neste arquivo: elas ficam em backend/.env.
 *
 * Campos vazios ("") não aparecem no site.
 * Endereços e WhatsApp abaixo foram copiados das publicações oficiais da marca
 * no Instagram (@limacielrio) e no Linktree (linktr.ee/limacielrio) em 12/11/2026.
 * CONFIRME com a loja antes de publicar.
 */
window.LIMA_CIEL_CONFIG = {
  /* Nome exibido. Observação: no Instagram (@limacielrio) o perfil aparece como "Li Maciel". */
  storeName: "Lima Ciel",
  tagline: "Moda elegante e confortável. Enaltecendo a beleza da mulher brasileira.",

  /*
   * Parcelamento exibido na página do produto ("até 6x de R$ 41,65 sem juros").
   * 0 = não exibe. Só ative com as condições reais configuradas no Mercado Pago.
   * minInstallment = valor mínimo de cada parcela.
   */
  installments: { maxNoInterest: 0, minInstallment: 0 },

  /* true = mostra a faixa avisando que produtos, preços e fotos são demonstrativos. */
  demoMode: true,

  instagram: { handle: "limacielrio", url: "https://www.instagram.com/limacielrio/" },
  linktree: "https://linktr.ee/limacielrio",
  email: "",

  /*
   * Lojas físicas. "pickup: true" = aparece como opção de retirada no checkout.
   * whatsapp: só números, com 55 + DDD.
   */
  stores: [
    {
      id: "freguesia",
      name: "Loja Freguesia",
      address: "Estrada dos Três Rios, 200 — Lj 110, Bl 03, Shopping Mainstreet",
      district: "Freguesia",
      city: "Rio de Janeiro — RJ",
      cep: "",
      phone: "(21) 96512-7571",
      whatsapp: "5521965127571",
      openingHours: "",
      pickup: true
    },
    {
      id: "centro",
      name: "Loja Centro",
      address: "Rua Gonçalves Dias, 19 B",
      district: "Centro",
      city: "Rio de Janeiro — RJ",
      cep: "",
      phone: "(21) 97717-6317",
      whatsapp: "5521977176317",
      openingHours: "",
      pickup: true
    }
  ],

  /* Texto opcional sobre a retirada (documento, prazo). Vazio = texto padrão. */
  pickupInstructions: "",

  checkout: {
    /* CPF é usado na nota fiscal e na etiqueta de envio. */
    requireCpf: true
  },

  shipping: {
    /*
     * Embalagem padrão POR PEÇA, usada na cotação do frete (o Melhor Envio agrupa as peças).
     * Valores iniciais de referência para roupas dobradas: confirme pesando e medindo
     * uma embalagem real. Cada produto pode ter "weightKg" próprio em products.js.
     */
    defaultItemPackage: { weightKg: 0.4, widthCm: 25, heightCm: 4, lengthCm: 32 }
  },

  /* Backend (pagamentos, frete, avisos). "" = mesmo endereço do site (/api).
     Se o backend estiver em outro domínio: "https://api.seudominio.com.br" */
  apiBaseUrl: "",

  /* Domínios aceitos para redirecionar ao pagamento (proteção contra redirecionamento falso). */
  allowedCheckoutHosts: ["mercadopago.com.br", "mercadopago.com", "mercadolivre.com.br", "mercadolibre.com"],

  maxQtyPerItem: 10
};
