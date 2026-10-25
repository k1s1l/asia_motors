import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";
import { getStore, SITE_URL } from "@/lib/store";
import { MAX_QTY, normalizePhone, validateOrder, type OrderForm } from "@/lib/order";
import { deliverOrder, isOrderingEnabled, newOrderNumber, type OrderRecord } from "@/lib/order-delivery";
import { productHref } from "@/lib/routes";

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const FIELDS: (keyof OrderForm)[] = ["name", "phone", "email", "city", "delivery", "payment", "comment", "vin"];

export async function POST(req: Request) {
  if (!isOrderingEnabled()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: { form?: Record<string, unknown>; lines?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  // Приховане поле-пастка для ботів
  if (body.website) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const form = Object.fromEntries(FIELDS.map((k) => [k, typeof body.form?.[k] === "string" ? String(body.form[k]).slice(0, 1000) : ""])) as unknown as OrderForm;
  const store = getStore();
  const errors = validateOrder(form, store);
  if (Object.keys(errors).length) return NextResponse.json({ error: "validation", errors }, { status: 422 });

  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 100) {
    return NextResponse.json({ error: "empty_cart" }, { status: 422 });
  }

  const items: OrderRecord["items"] = [];
  const problems: string[] = [];
  let currency = "UAH";
  for (const line of body.lines as { id?: unknown; qty?: unknown }[]) {
    const p = typeof line?.id === "string" ? getProductById(line.id) : undefined;
    const qty = Math.floor(Number(line?.qty));
    if (!p || p.price === null || p.available === false || !(qty >= 1 && qty <= MAX_QTY)) {
      problems.push(typeof line?.id === "string" ? line.id : "?");
      continue;
    }
    currency = p.currency;
    items.push({ id: p.id, sku: p.sku, name: p.name, brand: p.brand, price: p.price, qty, sum: Math.round(p.price * qty * 100) / 100, url: SITE_URL + productHref(p.slug) });
  }
  if (problems.length) return NextResponse.json({ error: "unavailable_items", ids: problems }, { status: 409 });

  const order: OrderRecord = {
    number: newOrderNumber(),
    createdAt: new Date().toISOString(),
    customer: {
      name: form.name.trim(),
      phone: normalizePhone(form.phone)!,
      email: form.email.trim() || undefined,
      city: form.city.trim(),
      delivery: form.delivery || undefined,
      payment: form.payment || undefined,
      vin: form.vin.trim().toUpperCase() || undefined,
      comment: form.comment.trim() || undefined,
    },
    items,
    total: Math.round(items.reduce((s, i) => s + i.sum, 0) * 100) / 100,
    currency,
  };

  if (!(await deliverOrder(order))) return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, number: order.number, total: order.total });
}
