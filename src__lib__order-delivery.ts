import "server-only";
import crypto from "node:crypto";
import { formatPrice } from "./format";

export interface OrderRecord {
  number: string;
  createdAt: string;
  customer: { name: string; phone: string; email?: string; city: string; delivery?: string; payment?: string; vin?: string; comment?: string };
  items: { id: string; sku?: string; name: string; brand?: string; price: number; qty: number; sum: number; url: string }[];
  total: number;
  currency: string;
}

export function orderingChannels() {
  return {
    webhook: Boolean(process.env.ORDER_WEBHOOK_URL),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  };
}

export function isOrderingEnabled() {
  const c = orderingChannels();
  return c.webhook || c.telegram;
}

async function sendWebhook(order: OrderRecord) {
  const body = JSON.stringify(order);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ORDER_WEBHOOK_SECRET) {
    headers["X-Signature-SHA256"] = crypto.createHmac("sha256", process.env.ORDER_WEBHOOK_SECRET).update(body).digest("hex");
  }
  const res = await fetch(process.env.ORDER_WEBHOOK_URL!, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

async function sendTelegram(order: OrderRecord) {
  const c = order.customer;
  const lines = [
    `<b>Нове замовлення №${order.number}</b>`,
    "",
    `👤 ${esc(c.name)}`,
    `📞 ${esc(c.phone)}`,
    c.email && `✉️ ${esc(c.email)}`,
    `📍 ${esc(c.city)}`,
    c.delivery && `🚚 ${esc(c.delivery)}`,
    c.payment && `💳 ${esc(c.payment)}`,
    c.vin && `VIN: ${esc(c.vin)}`,
    c.comment && `💬 ${esc(c.comment)}`,
    "",
    ...order.items.map((i) => `• ${esc(i.name)}${i.sku ? ` (арт. ${esc(i.sku)})` : ""} — ${i.qty} × ${formatPrice(i.price, order.currency)}`),
    "",
    `<b>Разом: ${formatPrice(order.total, order.currency)}</b>`,
  ].filter((x): x is string => typeof x === "string");
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}`);
}

/** Повертає true, якщо замовлення доставлено хоча б в один канал. */
export async function deliverOrder(order: OrderRecord): Promise<boolean> {
  const c = orderingChannels();
  const jobs: Promise<void>[] = [];
  if (c.webhook) jobs.push(sendWebhook(order));
  if (c.telegram) jobs.push(sendTelegram(order));
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => r.status === "rejected" && console.error(`[order ${order.number}] доставка не вдалася:`, r.reason));
  return results.some((r) => r.status === "fulfilled");
}

export function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd}-${crypto.randomInt(1000, 9999)}`;
}
