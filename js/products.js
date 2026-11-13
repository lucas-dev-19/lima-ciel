/*
 * CATÁLOGO — Lima Ciel
 * ---------------------------------------------------------------------------
 * ATENÇÃO: todos os produtos abaixo são DEMONSTRATIVOS (demo: true).
 * Nomes, preços e estoques são exemplos, e as fotos são ilustrativas de bancos de
 * imagens gratuitos (créditos em "credit"). Cada produto foi descrito a partir do
 * que a foto mostra. Substitua pelo catálogo oficial da loja.
 *
 * Campos: veja README.md, seção "2. Produtos".
 * Estoque: { "tamanho": quantidade }. Tudo 0 = produto ESGOTADO.
 */
(() => {
  const IMG = 'assets/images/catalog/';
  const pexels = (photographer, source) => ({ photographer, source, license: 'Pexels License' });
  const unsplash = (photographer, source) => ({ photographer, source, license: 'Unsplash License' });
  const ALL = ['38', '40', '42', '44', '46', '48', '50'];

  window.LIMA_CIEL_COLLECTIONS = [
    {
      slug: 'linho-e-leveza',
      name: 'Texturas naturais',
      description: 'Peças leves com textura de linho',
      image: { src: IMG + 'conjuntos-blazer-calca-bege-2.jpg', alt: 'Modelo de corpo inteiro usando conjunto de blazer e calça bege em campo aberto' }
    },
    {
      slug: 'alfaiataria',
      name: 'Alfaiataria leve',
      description: 'Para o trabalho e além',
      image: { src: IMG + 'conjuntos-jaqueta-saia-lapis-bege-1.jpg', alt: 'Modelo usando jaqueta cropped e saia lápis midi bege' }
    },
    {
      slug: 'estampas',
      name: 'Florais & estampas',
      description: 'Delicadeza para dias quentes',
      image: { src: IMG + 'vestidos-longo-azul-estampado-1.jpg', alt: 'Modelo usando vestido longo azul-claro com estampa floral' }
    }
  ];

  /* Imagens de campanha usadas na página inicial (também ilustrativas). */
  window.LIMA_CIEL_EDITORIAL = {
    hero: {
      src: IMG + 'editorial-orla-rio-de-janeiro.jpg',
      alt: 'Mulher de costas, sentada na mureta, olhando o mar de uma praia do Rio de Janeiro',
      credit: pexels('Marcelo Aut', 'https://www.pexels.com/photo/serene-beach-view-in-rio-de-janeiro-35784830/')
    },
    boutique: {
      src: IMG + 'editorial-caminhada-praia-linho.jpg',
      alt: 'Mulher caminhando na beira do mar com conjunto claro de camisa e calça larga',
      credit: pexels('Nati', 'https://www.pexels.com/photo/a-woman-walking-on-the-shore-12059014/')
    }
  };

  window.LIMA_CIEL_PRODUCTS = [
    /* ---------------- VESTIDOS ---------------- */
    {
      id: 'vestido-chemise-midi-off-white',
      name: 'Vestido Chemise Midi Off-white',
      category: 'Vestidos',
      price: 389.9,
      promoPrice: null,
      isNew: true,
      featured: true,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Off-white', hex: '#EFE9DD' }],
      stock: { 38: 3, 40: 4, 42: 4, 44: 3, 46: 2, 48: 1, 50: 0 },
      description: 'Chemise midi de caimento fluido, com gola de camisa, botões grandes em tom madeira e mangas curtas amplas. A cintura franzida com elástico marca a silhueta sem apertar, e as fendas laterais dão movimento ao caminhar.',
      details: ['Comprimento midi, abaixo do joelho', 'Abotoamento frontal inteiro', 'Mangas curtas amplas, levemente evasê', 'Cintura com elástico franzido', 'Fendas laterais na barra'],
      images: [
        { src: IMG + 'vestidos-chemise-off-white-1.jpg', alt: 'Modelo de corpo inteiro usando vestido chemise midi off-white com botões em tom madeira', credit: pexels('Zura Modebadze', 'https://www.pexels.com/photo/a-portrait-of-a-woman-wearing-a-white-dress-4385885/') },
        { src: IMG + 'vestidos-chemise-off-white-2.jpg', alt: 'Detalhe da gola, dos botões e da cintura franzida do vestido chemise off-white', credit: pexels('Zura Modebadze', 'https://www.pexels.com/photo/a-portrait-of-a-pretty-woman-in-a-white-dress-4385882/') },
        { src: IMG + 'vestidos-chemise-off-white-3.jpg', alt: 'Vestido chemise off-white visto de perfil, mostrando o franzido nas costas e a fenda lateral', credit: pexels('Zura Modebadze', 'https://www.pexels.com/photo/4385883/') }
      ]
    },
    {
      id: 'vestido-longo-floral-azul',
      name: 'Vestido Longo Floral Azul-céu',
      category: 'Vestidos',
      collection: 'estampas',
      price: 459.9,
      promoPrice: null,
      isNew: true,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Azul-céu estampado', hex: '#B9CFE0' }],
      stock: { 38: 2, 40: 3, 42: 3, 44: 2, 46: 2, 48: 1, 50: 1 },
      description: 'Vestido longo e solto, com estampa floral delicada em traço azul sobre fundo azul-claro. Decote V, mangas 3/4 com punho franzido e amarração, e saia franzida em camadas que termina em babado.',
      details: ['Comprimento longo, até o tornozelo', 'Decote V', 'Mangas 3/4 bufantes com cordão no punho', 'Saia franzida em camadas', 'Tecido leve e fluido'],
      images: [
        { src: IMG + 'vestidos-longo-azul-estampado-1.jpg', alt: 'Modelo de corpo inteiro usando vestido longo azul-claro com estampa floral', credit: unsplash('Reistor', 'https://unsplash.com/photos/young-woman-in-a-light-blue-dress-leans-against-wall-ukq1oxrHDW8') },
        { src: IMG + 'vestidos-longo-azul-estampado-2.jpg', alt: 'Modelo com as mãos nos bolsos do vestido longo azul estampado, ao ar livre', credit: unsplash('Reistor', 'https://unsplash.com/photos/woman-in-a-light-blue-patterned-dress-outdoors-86an_70IJHQ') }
      ]
    },
    {
      id: 'vestido-envelope-floral',
      name: 'Vestido Envelope Floral',
      category: 'Vestidos',
      collection: 'estampas',
      price: 429.9,
      promoPrice: null,
      isNew: true,
      featured: true,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Off-white floral', hex: '#F1ECE2' }],
      stock: { 38: 2, 40: 2, 42: 3, 44: 3, 46: 2, 48: 2, 50: 1 },
      description: 'Vestido longo transpassado, com amarração lateral que ajusta a cintura a cada corpo. Estampa de pequenas flores azuis sobre fundo off-white, decote V e fenda frontal para um caimento leve.',
      details: ['Modelagem envelope com amarração lateral', 'Decote V', 'Mangas curtas levemente evasê', 'Fenda frontal', 'Comprimento longo'],
      images: [
        { src: IMG + 'vestidos-transpassado-floral-1.jpg', alt: 'Vestido longo envelope off-white com flores azuis, do busto aos pés, mostrando a fenda frontal', credit: unsplash('Reistor', 'https://unsplash.com/photos/woman-in-a-floral-wrap-dress-with-a-high-slit-UJjzCVzYwuk') },
        { src: IMG + 'vestidos-transpassado-floral-2.jpg', alt: 'Modelo usando o vestido envelope floral entre folhagens, mostrando o decote V e a amarração', credit: unsplash('Reistor', 'https://unsplash.com/photos/woman-in-floral-wrap-dress-among-green-leaves-i9jVkytc2Fs') }
      ]
    },
    {
      id: 'vestido-chemise-verde-oliva',
      name: 'Vestido Chemise Verde-oliva',
      category: 'Vestidos',
      price: 399.9,
      promoPrice: 319.9,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Verde-oliva', hex: '#6B6B45' }],
      stock: { 38: 1, 40: 2, 42: 0, 44: 2, 46: 1, 48: 1, 50: 1 },
      description: 'Chemise midi em tecido de algodão mais estruturado, com saia ampla rodada e faixa do mesmo tecido para amarrar na cintura. Bolsos com lapela no peito e mangas bufantes com punho abotoado.',
      details: ['Comprimento midi', 'Dois bolsos com lapela no peito', 'Mangas 3/4 bufantes com punho abotoado', 'Faixa removível na cintura', 'Saia ampla rodada'],
      images: [
        { src: IMG + 'vestidos-chemise-verde-oliva-1.jpg', alt: 'Modelo de corpo inteiro usando vestido chemise midi verde-oliva com faixa na cintura', credit: pexels('RDNE Stock project', 'https://www.pexels.com/photo/woman-in-wearing-a-dress-standing-near-a-handrail-8217900/') },
        { src: IMG + 'vestidos-chemise-verde-oliva-2.jpg', alt: 'Detalhe do busto do vestido verde-oliva com bolsos de lapela e mangas bufantes', credit: pexels('RDNE Stock project', 'https://www.pexels.com/photo/woman-in-a-dress-posing-8217893/') }
      ]
    },
    {
      id: 'vestido-reto-areia',
      name: 'Vestido Reto Areia',
      category: 'Vestidos',
      collection: 'linho-e-leveza',
      price: 299.9,
      promoPrice: null,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Areia', hex: '#D9C7AE' }],
      stock: { 38: 2, 40: 3, 42: 3, 44: 2, 46: 2, 48: 1, 50: 1 },
      description: 'Vestido curto de corte reto, sem mangas e com decote redondo. A textura natural do tecido deixa a peça descontraída e fresca, fácil de usar sozinha ou com uma camisa aberta por cima.',
      details: ['Comprimento curto, logo acima do joelho', 'Sem mangas', 'Decote redondo', 'Corte reto levemente evasê', 'Tecido com textura natural'],
      images: [
        { src: IMG + 'vestidos-linho-areia-1.jpg', alt: 'Modelo de corpo inteiro usando vestido curto reto cor de areia, sem mangas', credit: unsplash('Reistor', 'https://unsplash.com/photos/a-woman-poses-in-a-simple-linen-dress-dziVRZYOFpI') }
      ]
    },

    /* ---------------- BLUSAS ---------------- */
    {
      id: 'camisa-gola-padre-branca',
      name: 'Camisa Gola Padre Branca',
      category: 'Blusas',
      collection: 'linho-e-leveza',
      price: 249.9,
      promoPrice: null,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Branco', hex: '#F7F5F0' }],
      stock: { 38: 3, 40: 4, 42: 4, 44: 3, 46: 2, 48: 2, 50: 1 },
      description: 'Camisa oversized de gola padre, com botões perolados e ombro caído. As mangas longas têm presilha para usar dobradas, e a barra arredondada mais longa permite usar a peça por fora ou como túnica.',
      details: ['Gola padre (mandarim)', 'Botões perolados', 'Mangas longas com presilha', 'Barra arredondada, comprimento túnica', 'Modelagem oversized'],
      images: [
        { src: IMG + 'blusas-camisa-linho-branca-1.jpg', alt: 'Modelo à beira-mar usando camisa branca oversized de gola padre com mangas dobradas', credit: pexels('Margo Evardson', 'https://www.pexels.com/photo/elegant-woman-posing-by-the-caribbean-sea-37166938/') },
        { src: IMG + 'blusas-camisa-linho-branca-2.jpg', alt: 'Camisa branca de gola padre usada como túnica, mostrando a barra arredondada', credit: pexels('Margo Evardson', 'https://www.pexels.com/photo/stylish-woman-in-white-shirt-at-tropical-resort-37166939/') }
      ]
    },
    {
      id: 'camisa-floral-off-white',
      name: 'Camisa Estampada Ramos',
      category: 'Blusas',
      collection: 'estampas',
      price: 229.9,
      promoPrice: null,
      isNew: true,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Off-white estampado', hex: '#EFE7D4' }],
      stock: { 38: 2, 40: 3, 42: 3, 44: 2, 46: 2, 48: 1, 50: 1 },
      description: 'Camisa de manga curta ampla e gola esporte aberta, em tecido fluido com leve brilho. A estampa de ramos com flores amarelas e folhas verde-acinzentadas sobre fundo off-white combina com saias e calças claras.',
      details: ['Gola esporte (camp collar)', 'Mangas curtas amplas, ombro caído', 'Modelagem solta', 'Tecido fluido com leve brilho'],
      images: [
        { src: IMG + 'blusas-camisa-floral-off-white-1.jpg', alt: 'Modelo ao ar livre usando camisa off-white com estampa de ramos e flores amarelas', credit: unsplash('Reistor', 'https://unsplash.com/photos/a-woman-wearing-a-floral-print-shirt-outdoors-3VNPTjuIsxM') },
        { src: IMG + 'blusas-camisa-floral-off-white-2.jpg', alt: 'Detalhe da gola esporte, da manga e da estampa de ramos da camisa', credit: unsplash('Reistor', 'https://unsplash.com/photos/woman-wearing-a-cream-blouse-with-floral-print-a7tB7Z7Z9zI') }
      ]
    },
    {
      id: 'camisa-preta-babados',
      name: 'Camisa Preta com Babados',
      category: 'Blusas',
      collection: 'alfaiataria',
      price: 239.9,
      promoPrice: 189.9,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Preto', hex: '#1E1B1B' }],
      stock: { 38: 2, 40: 2, 42: 2, 44: 1, 46: 1, 48: 0, 50: 0 },
      description: 'Camisa preta de manga longa com babado aplicado ao longo das mangas, que dá um toque romântico a um clássico. Punhos franzidos com elástico e comprimento na cintura, ótima com calças de cintura alta.',
      details: ['Gola de camisa e botões pretos', 'Babado ao longo das mangas', 'Punhos com elástico', 'Comprimento na cintura', 'Tecido leve e fluido'],
      images: [
        { src: IMG + 'blusas-camisa-preta-babados-1.jpg', alt: 'Modelo de corpo inteiro usando camisa preta com babados nas mangas e calça clara', credit: pexels('Jonathan Borba', 'https://www.pexels.com/photo/happy-brunette-woman-in-black-shirt-19456444/') },
        { src: IMG + 'blusas-camisa-preta-babados-2.jpg', alt: 'Detalhe da camisa preta mostrando o babado nas mangas e os punhos franzidos', credit: pexels('Jonathan Borba', 'https://www.pexels.com/photo/studio-shot-of-a-woman-in-a-trendy-casual-outfit-19456439/') }
      ]
    },

    /* ---------------- CALÇAS ---------------- */
    {
      id: 'calca-pantalona-greige',
      name: 'Calça Pantalona Greige',
      category: 'Calças',
      collection: 'alfaiataria',
      price: 329.9,
      promoPrice: null,
      isNew: false,
      featured: true,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Greige', hex: '#A79C90' }],
      stock: { 38: 3, 40: 3, 42: 4, 44: 3, 46: 2, 48: 2, 50: 1 },
      description: 'Pantalona de perna bem larga e cintura alta, com pregas frontais e vinco marcado. O cós tem elástico nas costas para mais conforto, e o tecido de alfaiataria fluido cria um caimento longo e elegante.',
      details: ['Cintura alta', 'Pregas frontais e vinco central', 'Elástico no cós traseiro', 'Comprimento longo', 'Tecido de alfaiataria fluido'],
      images: [
        { src: IMG + 'calcas-pantalona-taupe-1.jpg', alt: 'Modelo de corpo inteiro usando calça pantalona greige de cintura alta com camisa branca', credit: unsplash('Sergey Sokolov', 'https://unsplash.com/photos/woman-poses-on-a-stool-in-a-brown-studio-_-1BhQq6f5Q') },
        { src: IMG + 'calcas-pantalona-taupe-2.jpg', alt: 'Calça pantalona greige vista de perfil, com a modelo sentada', credit: unsplash('Sergey Sokolov', 'https://unsplash.com/photos/a-woman-poses-elegantly-on-a-wooden-stool-8FruAR7J1Ow') }
      ]
    },
    {
      id: 'calca-pantalona-off-white',
      name: 'Calça Pantalona Off-white',
      category: 'Calças',
      collection: 'alfaiataria',
      price: 309.9,
      promoPrice: 247.9,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Off-white', hex: '#EEE8DC' }],
      stock: { 38: 2, 40: 2, 42: 3, 44: 2, 46: 1, 48: 1, 50: 1 },
      description: 'Pantalona off-white de cintura alta, com pregas frontais e tecido mais encorpado, que mantém a forma ao longo do dia. Comprimento no tornozelo, pensado para usar com sapatilhas, mocassins ou saltos.',
      details: ['Cintura alta com cós reto', 'Pregas frontais', 'Fechamento com zíper frontal', 'Comprimento no tornozelo', 'Tecido encorpado'],
      images: [
        { src: IMG + 'calcas-pantalona-off-white-1.jpg', alt: 'Modelo de corpo inteiro usando calça pantalona off-white de cintura alta em frente a um prédio', credit: pexels('Brian Jiz', 'https://www.pexels.com/photo/young-elegant-woman-posing-in-front-of-a-modern-building-16998405/') },
        { src: IMG + 'calcas-pantalona-off-white-2.jpg', alt: 'Modelo caminhando de frente com a calça pantalona off-white', credit: pexels('Brian Jiz', 'https://www.pexels.com/photo/woman-standing-in-front-of-an-office-building-16998408/') }
      ]
    },
    {
      id: 'calca-wide-leg-cru',
      name: 'Calça Wide Leg Cru',
      category: 'Calças',
      collection: 'linho-e-leveza',
      price: 289.9,
      promoPrice: null,
      isNew: true,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Cru', hex: '#DCCFB9' }],
      stock: { 38: 2, 40: 3, 42: 3, 44: 2, 46: 2, 48: 1, 50: 0 },
      description: 'Calça de cintura alta e perna larga e reta, com barra larga dobrada e textura natural mesclada. Tem passantes, pregas frontais e bolsos, e funciona tanto no trabalho quanto no fim de semana.',
      details: ['Cintura alta com passantes', 'Pregas frontais', 'Bolsos laterais e traseiro', 'Barra larga dobrada', 'Tecido com textura natural'],
      images: [
        { src: IMG + 'calcas-pantalona-linho-cru-2.jpg', alt: 'Modelo de frente usando calça wide leg cru de cintura alta com camisa do mesmo tom', credit: pexels('Ana Pereira', 'https://www.pexels.com/photo/studio-shot-of-model-in-pants-15686362/') },
        { src: IMG + 'calcas-pantalona-linho-cru-1.jpg', alt: 'Calça wide leg cru vista de lado e de costas, mostrando o bolso traseiro e a barra dobrada', credit: pexels('Ana Pereira', 'https://www.pexels.com/photo/woman-posing-with-flowers-bouquet-15686366/') }
      ]
    },

    /* ---------------- SAIAS ---------------- */
    {
      id: 'saia-sereia-laise',
      name: 'Saia Sereia Laise',
      category: 'Saias',
      price: 349.9,
      promoPrice: null,
      isNew: true,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Off-white', hex: '#F0EBE1' }],
      stock: { 38: 1, 40: 2, 42: 2, 44: 2, 46: 1, 48: 1, 50: 0 },
      description: 'Saia longa sereia, ajustada no quadril e com abertura suave na barra. Os recortes diagonais alternam tecido texturizado e laise com ilhoses, num resultado delicado e muito feminino.',
      details: ['Modelagem sereia', 'Cintura alta', 'Recortes diagonais com laise', 'Comprimento no meio da canela'],
      images: [
        { src: IMG + 'saias-longa-renda-off-white-1.jpg', alt: 'Modelo de corpo inteiro usando saia longa sereia off-white com recortes de laise e camisa rosa', credit: unsplash('Zulfugar Karimov', 'https://unsplash.com/photos/woman-in-pink-shirt-and-skirt-V0CAxqlToZc') },
        { src: IMG + 'saias-longa-renda-off-white-2.jpg', alt: 'Saia sereia off-white vista de perfil, mostrando os recortes diagonais', credit: unsplash('Zulfugar Karimov', 'https://unsplash.com/photos/woman-in-pink-shirt-and-skirt-B_Bu5EyXtI0') }
      ]
    },
    {
      id: 'saia-midi-gode-nude',
      name: 'Saia Midi Godê Nude',
      category: 'Saias',
      collection: 'alfaiataria',
      price: 279.9,
      promoPrice: null,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Nude', hex: '#D8BFA8' }],
      stock: { 38: 2, 40: 2, 42: 3, 44: 2, 46: 2, 48: 1, 50: 1 },
      description: 'Saia midi longa de cintura alta, com cós largo e caimento godê fluido. O tecido liso, com leve brilho, deixa o visual sofisticado para o trabalho ou um jantar.',
      details: ['Cintura alta com cós largo', 'Modelagem godê', 'Comprimento até a canela', 'Tecido liso com leve brilho'],
      images: [
        { src: IMG + 'saias-midi-evase-bege-1.jpg', alt: 'Modelo de corpo inteiro usando saia midi godê nude com blusa acetinada, ao lado de uma porta de madeira', credit: pexels('Vika Kirillova', 'https://www.pexels.com/photo/an-elegant-woman-in-beige-dress-standing-beside-a-wooden-door-9767829/') }
      ]
    },
    {
      /* Exemplo de produto ESGOTADO: estoque zerado em todos os tamanhos. */
      id: 'saia-plissada-esmeralda',
      name: 'Saia Plissada Esmeralda',
      category: 'Saias',
      price: 259.9,
      promoPrice: null,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Verde-esmeralda', hex: '#1F4A3C' }],
      stock: { 38: 0, 40: 0, 42: 0, 44: 0, 46: 0, 48: 0, 50: 0 },
      description: 'Saia midi de plissado fino em verde-esmeralda profundo, com cós de elástico revestido em faixa acetinada. Leve e cheia de movimento, combina do básico listrado à camisa de seda.',
      details: ['Plissado fino', 'Cós com elástico revestido', 'Comprimento no meio da canela', 'Caimento fluido levemente evasê'],
      images: [
        { src: IMG + 'saias-midi-plissada-verde-1.jpg', alt: 'Modelo de corpo inteiro usando saia midi plissada verde-esmeralda com camiseta listrada', credit: pexels('Vika Glitter', 'https://www.pexels.com/photo/a-fashionable-woman-in-summer-outfit-13214674/') },
        { src: IMG + 'saias-midi-plissada-verde-2.jpg', alt: 'Saia plissada verde-esmeralda em movimento', credit: pexels('Vika Glitter', 'https://www.pexels.com/photo/woman-in-stripe-shirt-and-green-skirt-13214671/') }
      ]
    },

    /* ---------------- CONJUNTOS ---------------- */
    {
      id: 'conjunto-blazer-calca-aveia',
      name: 'Conjunto Blazer e Calça Aveia',
      category: 'Conjuntos',
      collection: 'linho-e-leveza',
      price: 599.9,
      promoPrice: null,
      isNew: true,
      featured: true,
      demo: true,
      sizes: ['38', '40', '42', '44', '46', '48'],
      colors: [{ name: 'Aveia', hex: '#CDBFA8' }],
      stock: { 38: 1, 40: 2, 42: 2, 44: 2, 46: 1, 48: 1 },
      description: 'Conjunto de alfaiataria em tecido mesclado com textura natural: blazer oversized transpassado com lapela e bolso no peito, e calça de cintura alta com perna reta e ampla. As peças também funcionam separadas.',
      details: ['Blazer transpassado com dois botões', 'Lapela e bolso no peito', 'Calça de cintura alta, perna reta e ampla', 'Tecido mesclado com textura natural', 'Vendido como conjunto'],
      images: [
        { src: IMG + 'conjuntos-blazer-calca-bege-1.jpg', alt: 'Modelo usando conjunto de blazer transpassado e calça cor aveia com regata branca', credit: pexels('Vika Kirillova', 'https://www.pexels.com/photo/shallow-focus-of-a-woman-holding-a-bag-8796284/') },
        { src: IMG + 'conjuntos-blazer-calca-bege-2.jpg', alt: 'Modelo de corpo inteiro em campo aberto usando o conjunto de blazer e calça aveia', credit: pexels('Vika Kirillova', 'https://www.pexels.com/photo/woman-in-a-beige-blazer-standing-on-a-grass-field-8796282/') }
      ]
    },
    {
      id: 'conjunto-jaqueta-saia-lapis-nude',
      name: 'Conjunto Jaqueta Cropped e Saia Lápis',
      category: 'Conjuntos',
      collection: 'alfaiataria',
      price: 549.9,
      promoPrice: null,
      isNew: false,
      featured: false,
      demo: true,
      sizes: ['38', '40', '42', '44', '46', '48'],
      colors: [{ name: 'Nude', hex: '#D6BBA2' }],
      stock: { 38: 1, 40: 2, 42: 2, 44: 1, 46: 1, 48: 0 },
      description: 'Conjunto de alfaiataria nude: jaqueta cropped com decote V e dois botões metálicos decorativos, e saia lápis midi de cintura alta. Uma composição elegante para eventos, reuniões e ocasiões especiais.',
      details: ['Jaqueta cropped, acima da cintura', 'Decote V sem gola', 'Botões metálicos decorativos', 'Saia lápis midi de cintura alta', 'Vendido como conjunto'],
      images: [
        { src: IMG + 'conjuntos-jaqueta-saia-lapis-bege-1.jpg', alt: 'Modelo de corpo inteiro usando jaqueta cropped e saia lápis midi nude', credit: pexels('Vika Kirillova', 'https://www.pexels.com/photo/woman-in-beige-dress-standing-on-the-walkway-9767821/') },
        { src: IMG + 'conjuntos-jaqueta-saia-lapis-bege-2.jpg', alt: 'Modelo descendo degraus com o conjunto de jaqueta cropped e saia lápis nude', credit: pexels('Vika Kirillova', 'https://www.pexels.com/photo/9767820/') }
      ]
    },
    {
      id: 'conjunto-camisa-calca-canela',
      name: 'Conjunto Camisa e Calça Canela',
      category: 'Conjuntos',
      collection: 'linho-e-leveza',
      price: 489.9,
      promoPrice: null,
      isNew: true,
      featured: false,
      demo: true,
      sizes: ALL,
      colors: [{ name: 'Canela', hex: '#8A4B32' }],
      stock: { 38: 2, 40: 2, 42: 3, 44: 2, 46: 2, 48: 1, 50: 1 },
      description: 'Conjunto em tom canela: camisa oversized de botões, com decote V aberto e mangas amplas 3/4, e pantalona de cintura alta no mesmo tecido. Confortável, elegante e fácil de usar.',
      details: ['Camisa oversized com gola de camisa', 'Mangas amplas 3/4 com barra virada', 'Calça pantalona de cintura alta', 'Peças no mesmo tecido', 'Vendido como conjunto'],
      images: [
        { src: IMG + 'conjuntos-camisa-calca-canela-1.jpg', alt: 'Modelo de corpo inteiro usando conjunto de camisa oversized e calça pantalona cor canela', credit: pexels('Merci Visual', 'https://www.pexels.com/photo/stylish-adult-woman-in-brown-clothing-on-neutral-background-35574662/') },
        { src: IMG + 'conjuntos-camisa-calca-canela-2.jpg', alt: 'Modelo sentada sorrindo, com detalhe da camisa canela de mangas amplas', credit: pexels('Merci Visual', 'https://www.pexels.com/photo/smiling-woman-in-stylish-brown-outfit-portrait-35574664/') }
      ]
    }
  ];
})();
