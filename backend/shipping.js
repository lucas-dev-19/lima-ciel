'use strict';
/*
 * Cotação de frete — Melhor Envio (API v2, endpoint /me/shipment/calculate).
 * O Melhor Envio consulta Correios (PAC, SEDEX, Mini Envios) e transportadoras
 * (Jadlog, Loggi, etc.) com os valores reais da conta da loja.
 *
 * Sem ME_TOKEN, ME_USER_AGENT e STORE_ORIGIN_CEP configurados, a cotação NÃO é feita
 * e o site informa que o frete está indisponível. Não existe valor fixo de reserva.
 */
const env = require('./env');
const { getStoreConfig, resolveItems, httpError, round2 } = require('./catalog');

const BASE_URL = {
  sandbox: 'https://sandbox.melhorenvio.com.br',
  production: 'https://www.melhorenvio.com.br'
};

function isConfigured() {
  const me = env.melhorEnvio;
  return Boolean(me.token && me.userAgent && /^\d{8}$/.test(env.store.originCep));
}

function packageFor(item, defaults) {
  return {
    id: item.id,
    width: Number(defaults.widthCm),
    height: Number(defaults.heightCm),
    length: Number(defaults.lengthCm),
    weight: Number(item.weightKg || defaults.weightKg),
    insurance_value: round2(item.unitPrice),
    quantity: item.qty
  };
}

/**
 * @param {string} destinationCep  CEP de destino (8 dígitos)
 * @param {Array} rawItems         itens vindos do navegador: { id, color, size, qty }
 * @returns {Promise<Array<{id:string, company:string, service:string, price:number, days:number|null}>>}
 */
async function quote(destinationCep, rawItems) {
  if (!isConfigured()) throw httpError(503, 'Cotação de frete ainda não configurada pela loja.');
  const to = String(destinationCep || '').replace(/\D/g, '');
  if (!/^\d{8}$/.test(to)) throw httpError(400, 'CEP de destino inválido.');

  const items = resolveItems(rawItems);
  const defaults = (getStoreConfig().shipping || {}).defaultItemPackage || {};
  for (const k of ['weightKg', 'widthCm', 'heightCm', 'lengthCm']) {
    if (!(Number(defaults[k]) > 0)) throw httpError(503, 'Dimensões de embalagem não configuradas (shipping.defaultItemPackage em js/config.js).');
  }

  const body = {
    from: { postal_code: env.store.originCep },
    to: { postal_code: to },
    products: items.map((i) => packageFor(i, defaults)),
    options: { receipt: false, own_hand: false }
  };
  if (env.melhorEnvio.services) body.services = env.melhorEnvio.services;

  let res;
  try {
    res = await fetch(`${BASE_URL[env.melhorEnvio.environment]}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.melhorEnvio.token}`,
        'User-Agent': env.melhorEnvio.userAgent
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000)
    });
  } catch (err) {
    console.error('[frete] falha de rede:', err.message);
    throw httpError(502, 'Não foi possível consultar o frete agora.');
  }

  if (!res.ok) {
    console.error('[frete] Melhor Envio respondeu', res.status, (await res.text()).slice(0, 300));
    throw httpError(502, 'Não foi possível consultar o frete agora.');
  }

  const data = await res.json();
  const options = (Array.isArray(data) ? data : [])
    .filter((o) => o && !o.error && Number(o.custom_price ?? o.price) > 0)
    .map((o) => ({
      id: String(o.id),
      company: (o.company && o.company.name) || '',
      service: String(o.name || ''),
      price: round2(Number(o.custom_price ?? o.price)),
      days: Number(o.custom_delivery_time ?? o.delivery_time) || null
    }))
    .sort((a, b) => a.price - b.price);

  return { options, items };
}

module.exports = { quote, isConfigured };
