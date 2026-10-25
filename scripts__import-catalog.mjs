#!/usr/bin/env node
/**
 * Імпорт каталогу Asia Motors у data/catalog.json.
 *
 *   npm run import:catalog -- <файл або URL> [--out data/catalog.json] [--format yml|csv]
 *
 * Підтримувані джерела:
 *  - YML/XML-фід (yml_catalog) — стандартний експорт Horoshop, OpenCart, Prom.ua, Rozetka;
 *  - CSV (роздільник «,» або «;») з заголовками українською, російською чи англійською.
 *
 * Скрипт нічого не вигадує: поля, яких немає в джерелі, залишаються порожніми,
 * і сайт їх просто не показує.
 */
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const source = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!source) {
  console.error("Вкажіть файл або URL фіду: npm run import:catalog -- ./export.xml");
  process.exit(1);
}
const outPath = path.resolve(opt("out", process.env.CATALOG_PATH || "data/catalog.json"));

/* ---------- утиліти ---------- */

const TRANSLIT = { а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ё: "e", ъ: "" };
const slugify = (s) =>
  String(s).toLowerCase().split("").map((c) => TRANSLIT[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";

function uniqueSlugger() {
  const used = new Set();
  return (base, fallback) => {
    let s = slugify(base);
    if (used.has(s)) s = `${s}-${slugify(fallback)}`;
    let n = 2;
    const root = s;
    while (used.has(s)) s = `${root}-${n++}`;
    used.add(s);
    return s;
  };
}

const text = (v) => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return text(v["#text"] ?? "");
  return String(v).trim();
};
const asArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const toNumber = (v) => {
  const s = text(v).replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const decodeEntities = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

/** Простий санітайзер: лише базове форматування, без скриптів, стилів і атрибутів-обробників. */
const ALLOWED = new Set(["p", "br", "ul", "ol", "li", "b", "strong", "i", "em", "u", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "td", "th", "span", "div", "a", "sup", "sub"]);
function sanitizeHtml(html) {
  if (!html) return undefined;
  let s = /&lt;\w/.test(html) && !/<\w/.test(html) ? decodeEntities(html) : html;
  s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return t === "img" ? "" : " ";
    if (m.startsWith("</")) return `</${t}>`;
    if (t === "a") {
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
      return href && /^https?:\/\//i.test(href) ? `<a href="${href.replace(/"/g, "&quot;")}" rel="nofollow noopener" target="_blank">` : "<a>";
    }
    return `<${t}>`;
  });
  s = s.replace(/\s+/g, " ").trim();
  if (!s.includes("<")) s = s.split(/\n{2,}/).map((p) => `<p>${p}</p>`).join("");
  return s.replace(/<[^>]+>/g, "").trim() ? s : undefined;
}

/* ---------- сумісність ---------- */

const COMPAT_PARAM = /сумісн|застосов|применим|совместим|марка\s*авто|модель\s*авто|для\s*авто|автомобіл|автомобил|compatib|fitment/i;
// Марки, які шукаються в полях сумісності (і, за їх відсутності, в назві товару)
const MAKES = ["Acura", "BYD", "Chery", "Chevrolet", "Daewoo", "Daihatsu", "Datsun", "Dongfeng", "FAW", "Geely", "Great Wall", "Haval", "Honda", "Hyundai", "Infiniti", "Isuzu", "JAC", "Kia", "Lexus", "Lifan", "Mazda", "Mitsubishi", "Nissan", "Ravon", "Subaru", "Suzuki", "SsangYong", "Toyota", "Zotye", "MG", "Changan", "Chery Tiggo", "Jetour", "Exeed", "Zeekr"];
const MAKE_ALIASES = { "Chery Tiggo": "Chery", "Ssang Yong": "SsangYong", "Грейт Вол": "Great Wall", "Чері": "Chery", "Джилі": "Geely", "Кіа": "Kia", "Хюндай": "Hyundai", "Хендай": "Hyundai", "Тойота": "Toyota", "Ніссан": "Nissan", "Мазда": "Mazda", "Міцубісі": "Mitsubishi", "Хонда": "Honda", "Субару": "Subaru", "Сузукі": "Suzuki", "Ліфан": "Lifan", "Шевроле": "Chevrolet", "Деу": "Daewoo" };
const makeRe = new RegExp(`(?<![\\p{L}\\d])(${[...MAKES, ...Object.keys(MAKE_ALIASES)].sort((a, b) => b.length - a.length).map((m) => m.replace(/\s+/g, "\\s*")).join("|")})(?![\\p{L}\\d])`, "giu");

function findMakes(str) {
  const out = new Set();
  for (const m of str.matchAll(makeRe)) {
    const raw = m[1].replace(/\s+/g, " ");
    const canonical = MAKES.find((x) => x.toLowerCase() === raw.toLowerCase()) ?? Object.entries(MAKE_ALIASES).find(([k]) => k.toLowerCase() === raw.toLowerCase())?.[1] ?? raw;
    out.add(MAKE_ALIASES[canonical] ?? canonical);
  }
  return [...out];
}

function splitCompat(v) {
  return v.split(/[;\n|]|,(?!\d)/).map((x) => x.trim()).filter((x) => x.length > 1);
}

function finalizeProduct(p) {
  const compat = [];
  const params = [];
  for (const x of p.params) {
    if (COMPAT_PARAM.test(x.name)) compat.push(...splitCompat(x.value));
    else params.push(x);
  }
  p.params = params;
  p.compatibility = [...new Set([...(p.compatibility ?? []), ...compat])];
  const fromCompat = findMakes(p.compatibility.join(" | "));
  p.carMakes = fromCompat.length ? fromCompat : findMakes(p.name);
  return p;
}

/* ---------- YML ---------- */

function parseYml(xml) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text", parseTagValue: false, trimValues: true, cdataPropName: "#cdata" });
  const doc = parser.parse(xml);
  const shop = doc.yml_catalog?.shop ?? doc.shop;
  if (!shop) throw new Error("Не знайдено <yml_catalog><shop> — це не YML-фід");
  const cdata = (v) => (v && typeof v === "object" && "#cdata" in v ? String(v["#cdata"]) : text(v));

  const catSlug = uniqueSlugger();
  const categories = asArray(shop.categories?.category).map((c) => ({
    id: text(c["@id"]),
    parentId: text(c["@parentId"]) || null,
    name: text(c),
  }));
  for (const c of categories) c.slug = catSlug(c.name, c.id);

  const prodSlug = uniqueSlugger();
  const currency = text(asArray(shop.currencies?.currency)[0]?.["@id"]) || "UAH";
  const offers = asArray(shop.offers?.offer);
  const products = offers.map((o) => {
    const id = text(o["@id"]);
    const name = cdata(o.name) || cdata(o.name_ua) || cdata(o.model) || [cdata(o.typePrefix), cdata(o.vendor), cdata(o.model)].filter(Boolean).join(" ");
    const avail = text(o["@available"]);
    const stockQty = toNumber(o.stock_quantity ?? o.quantity_in_stock ?? o.quantity);
    const params = asArray(o.param)
      .map((x) => ({ name: text(x["@name"]), value: [cdata(x), text(x["@unit"])].filter(Boolean).join(" ") }))
      .filter((x) => x.name && x.value);
    const price = toNumber(o.price);
    const oldPrice = toNumber(o.oldprice ?? o.price_old);
    const sku = cdata(o.vendorCode) || cdata(o.article) || undefined;
    return finalizeProduct({
      id,
      slug: prodSlug(name, sku || id),
      name,
      categoryId: text(o.categoryId) || null,
      sku,
      brand: cdata(o.vendor) || undefined,
      price: price && price > 0 ? price : null,
      oldPrice: oldPrice && price && oldPrice > price ? oldPrice : undefined,
      currency: text(o.currencyId) || currency,
      available: avail === "true" ? true : avail === "false" ? false : stockQty !== null ? stockQty > 0 : null,
      stockText: undefined,
      images: [...new Set(asArray(o.picture).map(text).filter((u) => /^https?:\/\//.test(u)))],
      descriptionHtml: sanitizeHtml(cdata(o.description_ua) || cdata(o.description)),
      params,
      compatibility: [],
      sourceUrl: text(o.url) || undefined,
    });
  });
  return { categories, products };
}

/* ---------- CSV ---------- */

function parseCsvRows(src) {
  const firstLine = src.slice(0, src.indexOf("\n"));
  const delim = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ";" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const COLS = {
  id: /^(id|ід|код товару|product[_ ]?id|унікальний ідентифікатор)$/i,
  name: /^(name|назва|назва товару|назва_позиції|название|наименование|title)$/i,
  sku: /^(sku|артикул|vendor ?code|код|код_товару|part ?number|номер)$/i,
  price: /^(price|ціна|цена|вартість)$/i,
  oldPrice: /^(old ?price|стара ціна|старая цена|ціна до знижки|compare ?at ?price)$/i,
  brand: /^(brand|vendor|бренд|виробник|производитель|марка виробника)$/i,
  category: /^(category|категорія|категория|розділ|раздел|група|группа)$/i,
  images: /^(images?|фото|зображення|изображени[ея]|посилання на зображення|image ?url|picture)$/i,
  available: /^(available|наявність|наличие|в наявності|stock|залишок|остаток|кількість|количество)$/i,
  description: /^(description|опис|описание)$/i,
  url: /^(url|посилання|ссылка)$/i,
  compatibility: /^(compatibility|сумісність|застосовність|применимость|совместимость|марка авто|авто)$/i,
};

function parseCsv(src) {
  const rows = parseCsvRows(src.replace(/^﻿/, ""));
  const header = rows.shift().map((h) => h.trim());
  const idx = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, header.findIndex((h) => re.test(h))]));
  if (idx.name < 0) throw new Error(`У CSV немає колонки з назвою товару. Заголовки: ${header.join(" | ")}`);
  const used = new Set(Object.values(idx).filter((i) => i >= 0));
  const paramCols = header.map((h, i) => ({ h, i })).filter(({ h, i }) => !used.has(i) && h);

  const catSlug = uniqueSlugger();
  const catByPath = new Map();
  const categories = [];
  const ensureCategory = (pathStr) => {
    const parts = pathStr.split(/\s*(?:>|\/|\\|»)\s*/).map((x) => x.trim()).filter(Boolean);
    let parentId = null;
    let key = "";
    for (const part of parts) {
      key += `>${part}`;
      if (!catByPath.has(key)) {
        const c = { id: `c${categories.length + 1}`, parentId, name: part, slug: catSlug(part, String(categories.length + 1)) };
        categories.push(c);
        catByPath.set(key, c.id);
      }
      parentId = catByPath.get(key);
    }
    return parentId;
  };

  const prodSlug = uniqueSlugger();
  const get = (r, k) => (idx[k] >= 0 ? (r[idx[k]] ?? "").trim() : "");
  const products = rows.map((r, n) => {
    const name = get(r, "name");
    const sku = get(r, "sku") || undefined;
    const id = get(r, "id") || sku || `p${n + 1}`;
    const price = toNumber(get(r, "price"));
    const oldPrice = toNumber(get(r, "oldPrice"));
    const availRaw = get(r, "available").toLowerCase();
    const availNum = toNumber(availRaw);
    const available = !availRaw ? null
      : /^(так|да|yes|true|1|\+|в наявності|є в наявності|в наличии|есть)$/.test(availRaw) ? true
      : /^(ні|нет|no|false|0|-|немає|немає в наявності|нет в наличии|під замовлення|под заказ)$/.test(availRaw) ? false
      : availNum !== null ? availNum > 0 : null;
    return finalizeProduct({
      id,
      slug: prodSlug(name, sku || id),
      name,
      categoryId: get(r, "category") ? ensureCategory(get(r, "category")) : null,
      sku,
      brand: get(r, "brand") || undefined,
      price: price && price > 0 ? price : null,
      oldPrice: oldPrice && price && oldPrice > price ? oldPrice : undefined,
      currency: "UAH",
      available,
      stockText: availRaw && available === null ? get(r, "available") : undefined,
      images: get(r, "images").split(/[\s,;|]+/).filter((u) => /^https?:\/\//.test(u)),
      descriptionHtml: sanitizeHtml(get(r, "description")),
      params: paramCols.map(({ h, i }) => ({ name: h, value: (r[i] ?? "").trim() })).filter((x) => x.value),
      compatibility: get(r, "compatibility") ? splitCompat(get(r, "compatibility")) : [],
      sourceUrl: get(r, "url") || undefined,
    });
  }).filter((p) => p.name);
  return { categories, products };
}

/* ---------- запуск ---------- */

async function readSource(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Не вдалося завантажити ${src}: HTTP ${res.status}`);
    return res.text();
  }
  return fs.readFileSync(src, "utf8");
}

const raw = await readSource(source);
const format = opt("format") || (/^\s*(<\?xml|<yml_catalog|<!DOCTYPE yml)/i.test(raw) ? "yml" : "csv");
const { categories, products } = format === "yml" ? parseYml(raw) : parseCsv(raw);

// Без дублікатів id і без товарів без назви
const seen = new Set();
const clean = products.filter((p) => p.name && !seen.has(p.id) && seen.add(p.id));
const catIds = new Set(categories.map((c) => c.id));
for (const p of clean) if (p.categoryId && !catIds.has(p.categoryId)) p.categoryId = null;
for (const p of clean) for (const k of Object.keys(p)) if (p[k] === undefined) delete p[k];

const catalog = {
  meta: { source: /^https?:/.test(source) ? source : path.basename(source), importedAt: new Date().toISOString() },
  categories,
  products: clean,
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath + ".tmp", JSON.stringify(catalog));
fs.renameSync(outPath + ".tmp", outPath);

const stat = (f) => clean.filter(f).length;
console.log(`✔ Імпортовано: ${clean.length} товарів, ${categories.length} категорій → ${path.relative(process.cwd(), outPath)}`);
console.log(`  з ціною: ${stat((p) => p.price !== null)}, з фото: ${stat((p) => p.images.length)}, з артикулом: ${stat((p) => p.sku)}, з наявністю: ${stat((p) => p.available !== null)}, із сумісністю: ${stat((p) => p.compatibility.length)}`);
if (products.length !== clean.length) console.log(`  пропущено (без назви або дублікати id): ${products.length - clean.length}`);
