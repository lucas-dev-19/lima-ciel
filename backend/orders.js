'use strict';
/*
 * Armazenamento simples de pedidos e avisos de reposição em arquivos JSON.
 * Suficiente para começar; em produção com volume, troque por um banco de dados
 * mantendo as mesmas funções (create/get/update).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const env = require('./env');

fs.mkdirSync(env.dataDir, { recursive: true });

function jsonStore(fileName) {
  const file = path.join(env.dataDir, fileName);
  let queue = Promise.resolve();

  const read = () => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return {}; }
  };
  const write = (data) => {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  };
  /* Serializa as gravações para não perder alterações concorrentes. */
  const mutate = (fn) => {
    const run = queue.then(() => { const data = read(); const out = fn(data); write(data); return out; });
    queue = run.catch(() => {});
    return run;
  };
  return { read, mutate };
}

const ordersDb = jsonStore('orders.json');
const alertsDb = jsonStore('restock-alerts.json');

const newId = () => `LC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

async function createOrder(order) {
  const id = newId();
  const accessKey = crypto.randomBytes(18).toString('base64url');
  const now = new Date().toISOString();
  const record = { ...order, id, accessKey, status: 'aguardando_pagamento', payments: [], createdAt: now, updatedAt: now };
  await ordersDb.mutate((db) => { db[id] = record; });
  return record;
}

const getOrder = (id) => ordersDb.read()[id] || null;

function updateOrder(id, fn) {
  return ordersDb.mutate((db) => {
    if (!db[id]) return null;
    fn(db[id]);
    db[id].updatedAt = new Date().toISOString();
    return db[id];
  });
}

/* Dados mínimos que o cliente pode ver na página de retorno (sem dados pessoais completos). */
function publicView(order) {
  return {
    id: order.id,
    status: order.status,
    total: order.totals.total,
    delivery: order.delivery.method,
    items: order.items.map(({ name, size, color, qty }) => ({ name, size, color, qty })),
    updatedAt: order.updatedAt
  };
}

function addRestockAlert(alert) {
  return alertsDb.mutate((db) => {
    const key = crypto.createHash('sha256').update(`${alert.productId}|${alert.size}|${alert.email.toLowerCase()}`).digest('hex').slice(0, 24);
    db[key] = { ...alert, createdAt: (db[key] && db[key].createdAt) || new Date().toISOString(), updatedAt: new Date().toISOString() };
    return key;
  });
}

module.exports = { createOrder, getOrder, updateOrder, publicView, addRestockAlert };
