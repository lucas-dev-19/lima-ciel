'use strict';
/*
 * Configuração do backend (lida de variáveis de ambiente).
 * Os segredos (tokens do Mercado Pago e do Melhor Envio) ficam SOMENTE aqui,
 * nunca no JavaScript do navegador. Veja backend/.env.example.
 */
const path = require('node:path');

try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch (_) {
  /* sem arquivo .env: usa as variáveis já definidas no ambiente (ex.: painel da hospedagem) */
}

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const digits = (v) => String(v || '').replace(/\D/g, '');
const trimSlash = (v) => String(v || '').trim().replace(/\/+$/, '');

module.exports = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  /* Endereço público do site (usado nas URLs de retorno do Mercado Pago). Ex.: https://www.limaciel.com.br */
  publicSiteUrl: trimSlash(process.env.PUBLIC_SITE_URL),
  /* Endereço público deste backend (usado na URL do webhook). Ex.: https://api.limaciel.com.br */
  publicApiUrl: trimSlash(process.env.PUBLIC_API_URL),
  /* Origens autorizadas a chamar a API pelo navegador (CORS). Ex.: https://www.limaciel.com.br */
  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
  /* true = também serve os arquivos do site (prático para rodar tudo localmente). */
  serveStatic: process.env.SERVE_STATIC !== 'false',
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data'),

  mercadoPago: {
    accessToken: String(process.env.MP_ACCESS_TOKEN || '').trim(),
    webhookSecret: String(process.env.MP_WEBHOOK_SECRET || '').trim(),
    statementDescriptor: String(process.env.MP_STATEMENT_DESCRIPTOR || 'LIMACIEL').slice(0, 13),
    maxInstallments: Number(process.env.MP_MAX_INSTALLMENTS) || 0,
    /* Tipos de pagamento excluídos do Checkout Pro. Padrão: boleto (ticket). Pix = bank_transfer. */
    excludedPaymentTypes: list(process.env.MP_EXCLUDED_PAYMENT_TYPES ?? 'ticket')
  },

  melhorEnvio: {
    token: String(process.env.ME_TOKEN || '').trim(),
    environment: process.env.ME_ENV === 'production' ? 'production' : 'sandbox',
    /* O Melhor Envio exige um User-Agent com nome da aplicação e e-mail técnico. Ex.: "Lima Ciel Loja (tecnico@exemplo.com)" */
    userAgent: String(process.env.ME_USER_AGENT || '').trim(),
    /* IDs de serviços a cotar (vazio = todos os habilitados na conta). Ex.: "1,2" = Correios PAC e SEDEX. */
    services: list(process.env.ME_SERVICES).join(',')
  },

  store: {
    originCep: digits(process.env.STORE_ORIGIN_CEP)
  }
});
