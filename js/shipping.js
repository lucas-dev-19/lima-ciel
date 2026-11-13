/* ==========================================================
   Endereço e frete.
   - CEP: ViaCEP (API pública, gratuita, sem chave).
   - Frete: cotação real feita pelo backend (Melhor Envio), nunca no navegador.
     Sem backend/credenciais, a cotação é informada como indisponível:
     não existe valor fixo nem estimativa simulada.
   Depende de: utils.js
   ========================================================== */
(() => {
  'use strict';
  const LC = window.LC;

  const cepCache = new Map();

  /** @returns {Promise<{cep, street, district, city, state}>} */
  async function lookupCep(value) {
    const cep = LC.digits(value);
    if (!/^\d{8}$/.test(cep)) throw new Error('Digite um CEP com 8 números.');
    if (cepCache.has(cep)) return cepCache.get(cep);
    let data;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
      if (!res.ok) throw new Error();
      data = await res.json();
    } catch (_) {
      throw new Error('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
    }
    if (data.erro) throw new Error('CEP não encontrado. Confira os números.');
    const out = { cep, street: data.logradouro || '', district: data.bairro || '', city: data.localidade || '', state: data.uf || '' };
    cepCache.set(cep, out);
    return out;
  }

  /**
   * @param {string} cep
   * @param {Array<{id,color,size,qty}>} items
   * @returns {Promise<{available:true, options:Array}|{available:false, reason:string}>}
   */
  async function quote(cep, items) {
    const status = await LC.integrations();
    if (!status.shipping) {
      return {
        available: false,
        reason: status.online
          ? 'A cotação automática de frete ainda não foi configurada pela loja.'
          : 'A cotação de frete depende do servidor da loja, que ainda não está ativo.'
      };
    }
    try {
      const data = await LC.api('/shipping/quote', { method: 'POST', body: { cep: LC.digits(cep), items } });
      if (!data.options || !data.options.length) {
        return { available: false, reason: 'Nenhuma transportadora atende este CEP para este pedido.' };
      }
      return { available: true, options: data.options };
    } catch (err) {
      return { available: false, reason: err.message || 'Não foi possível cotar o frete agora.' };
    }
  }

  const deliveryText = (days) => (days ? `até ${days} ${days === 1 ? 'dia útil' : 'dias úteis'}` : 'prazo informado pela transportadora');

  /* Bloco "fale com a loja" exibido quando a cotação não está disponível. */
  function contactHtml(message) {
    const links = LC.stores()
      .map((s) => ({ s, href: LC.waLink(s.whatsapp, message) }))
      .filter((x) => x.href)
      .map((x) => `<a class="btn btn--line btn--sm" href="${x.href}" target="_blank" rel="noopener noreferrer">${LC.ICON.whatsapp} WhatsApp ${LC.esc(x.s.district || x.s.name)}</a>`);
    const dm = LC.instagramDm();
    if (dm) links.push(`<a class="btn btn--line btn--sm" href="${dm}" target="_blank" rel="noopener noreferrer">${LC.ICON.instagram} Direct no Instagram</a>`);
    return links.length ? `<div class="contact-row">${links.join('')}</div>` : '';
  }

  window.LC.shipping = { lookupCep, quote, deliveryText, contactHtml };
})();
