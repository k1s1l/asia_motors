import type { Product } from "./types";

export type SortKey = "default" | "price_asc" | "price_desc" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "За замовчуванням" },
  { value: "price_asc", label: "Спочатку дешевші" },
  { value: "price_desc", label: "Спочатку дорожчі" },
  { value: "name", label: "За назвою" },
];

export const PAGE_SIZE = 24;
const PARAM_PREFIX = "f_";

export interface ListQuery {
  q: string;
  brands: string[];
  makes: string[];
  inStock: boolean;
  min: number | null;
  max: number | null;
  params: Record<string, string[]>;
  sort: SortKey;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean);
const num = (v: string | string[] | undefined) => {
  const n = Number(list(v)[0]);
  return Number.isFinite(n) && n >= 0 && list(v).length ? n : null;
};

export function parseListQuery(sp: RawParams): ListQuery {
  const params: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (key.startsWith(PARAM_PREFIX)) params[key.slice(PARAM_PREFIX.length)] = list(value);
  }
  const sort = list(sp.sort)[0] as SortKey;
  return {
    q: (list(sp.q)[0] ?? "").trim().slice(0, 200),
    brands: list(sp.brand),
    makes: list(sp.make),
    inStock: list(sp.stock)[0] === "1",
    min: num(sp.min),
    max: num(sp.max),
    params,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "default",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

export function paramKey(name: string) {
  return PARAM_PREFIX + name;
}

/* ---------- пошук ---------- */

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[’'`]/g, "");
const compact = (s: string) => normalize(s).replace(/[\s\-./_]/g, "");

export function searchScore(p: Product, q: string): number {
  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const qc = compact(q);
  let score = 0;
  if (p.sku && qc.length >= 3) {
    const sku = compact(p.sku);
    if (sku === qc) score += 100;
    else if (sku.includes(qc)) score += 50;
  }
  const name = normalize(p.name);
  const hay = normalize(
    [p.name, p.sku, p.brand, ...p.compatibility, ...p.params.map((x) => x.value)].filter(Boolean).join(" "),
  );
  if (tokens.every((t) => hay.includes(t))) {
    score += 10 + tokens.filter((t) => name.includes(t)).length * 5;
    if (name.startsWith(tokens[0])) score += 3;
  }
  return score;
}

export function searchProducts(products: Product[], q: string): Product[] {
  return products
    .map((p) => ({ p, s: searchScore(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

/* ---------- фільтри та фасети ---------- */

type Facet = "brand" | "make" | "stock" | "price" | `param:${string}`;

function matches(p: Product, q: ListQuery, skip?: Facet): boolean {
  if (skip !== "brand" && q.brands.length && !(p.brand && q.brands.includes(p.brand))) return false;
  if (skip !== "make" && q.makes.length && !p.carMakes.some((m) => q.makes.includes(m))) return false;
  if (skip !== "stock" && q.inStock && p.available !== true) return false;
  if (skip !== "price") {
    if (q.min !== null && (p.price === null || p.price < q.min)) return false;
    if (q.max !== null && (p.price === null || p.price > q.max)) return false;
  }
  for (const [name, values] of Object.entries(q.params)) {
    if (!values.length || skip === `param:${name}`) continue;
    if (!p.params.some((x) => x.name === name && values.includes(x.value))) return false;
  }
  return true;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface Facets {
  brands: FacetOption[];
  makes: FacetOption[];
  params: { name: string; options: FacetOption[] }[];
  price: { min: number; max: number } | null;
  inStockCount: number;
  hasStockData: boolean;
}

function countBy(products: Product[], pick: (p: Product) => string[]): FacetOption[] {
  const m = new Map<string, number>();
  for (const p of products) for (const v of new Set(pick(p))) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value, "uk"));
}

const MAX_PARAM_FACETS = 8;
const MAX_PARAM_VALUES = 40;

/**
 * Фільтри будуються лише з полів, які реально заповнені у товарах вибірки.
 * Якщо поле однакове для всіх товарів або відсутнє — фільтр не показується.
 */
export function buildFacets(base: Product[], q: ListQuery): Facets {
  const brands = countBy(base.filter((p) => matches(p, q, "brand")), (p) => (p.brand ? [p.brand] : []));
  const makes = countBy(base.filter((p) => matches(p, q, "make")), (p) => p.carMakes);

  const paramCoverage = new Map<string, Set<string>>();
  for (const p of base) for (const x of p.params) {
    if (!paramCoverage.has(x.name)) paramCoverage.set(x.name, new Set());
    paramCoverage.get(x.name)!.add(x.value);
  }
  const paramNames = [...paramCoverage]
    .filter(([name, values]) => values.size >= 2 && values.size <= MAX_PARAM_VALUES || q.params[name]?.length)
    .map(([name]) => name)
    .sort((a, b) => base.filter((p) => p.params.some((x) => x.name === b)).length - base.filter((p) => p.params.some((x) => x.name === a)).length)
    .slice(0, MAX_PARAM_FACETS);

  const params = paramNames.map((name) => ({
    name,
    options: countBy(base.filter((p) => matches(p, q, `param:${name}`)), (p) =>
      p.params.filter((x) => x.name === name).map((x) => x.value),
    ),
  }));

  const prices = base.map((p) => p.price).filter((x): x is number => x !== null);
  return {
    brands: brands.length >= 2 || q.brands.length ? brands : [],
    makes: makes.length >= 2 || q.makes.length ? makes : [],
    params,
    price: prices.length >= 2 ? { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) } : null,
    inStockCount: base.filter((p) => p.available === true && matches(p, q, "stock")).length,
    hasStockData: base.some((p) => p.available !== null),
  };
}

export function applyListQuery(base: Product[], q: ListQuery) {
  const filtered = base.filter((p) => matches(p, q));
  const sorted = [...filtered];
  const priced = (p: Product, dir: 1 | -1) => (p.price === null ? Infinity : p.price * dir);
  if (q.sort === "price_asc") sorted.sort((a, b) => priced(a, 1) - priced(b, 1));
  if (q.sort === "price_desc") sorted.sort((a, b) => priced(a, -1) - priced(b, -1));
  if (q.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "uk"));
  // Товари в наявності — вище, порядок джерела зберігається в межах групи
  if (q.sort === "default") sorted.sort((a, b) => Number(b.available === true) - Number(a.available === true));

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  return {
    total: sorted.length,
    page,
    pages,
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}

export function hasActiveFilters(q: ListQuery) {
  return Boolean(
    q.brands.length || q.makes.length || q.inStock || q.min !== null || q.max !== null ||
      Object.values(q.params).some((v) => v.length),
  );
}
