import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Catalog, Category, Product } from "./types";

const CATALOG_PATH = path.resolve(process.cwd(), process.env.CATALOG_PATH || "data/catalog.json");

interface Indexed {
  mtime: number;
  catalog: Catalog;
  byId: Map<string, Category>;
  bySlug: Map<string, Category>;
  children: Map<string | null, Category[]>;
  productBySlug: Map<string, Product>;
  productById: Map<string, Product>;
}

let cache: Indexed | null = null;

/** Каталог перечитується, коли файл змінюється (після імпорту), без перезбірки сайту. */
function load(): Indexed {
  let mtime = 0;
  try {
    mtime = fs.statSync(CATALOG_PATH).mtimeMs;
  } catch {
    // файлу немає — працюємо з порожнім каталогом
  }
  if (cache && cache.mtime === mtime) return cache;

  let catalog: Catalog = { meta: { source: null, importedAt: null }, categories: [], products: [] };
  if (mtime) {
    try {
      catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    } catch (err) {
      console.error(`[catalog] Не вдалося прочитати ${CATALOG_PATH}:`, err);
    }
  }

  const byId = new Map(catalog.categories.map((c) => [c.id, c]));
  const children = new Map<string | null, Category[]>();
  for (const c of catalog.categories) {
    const parent = c.parentId && byId.has(c.parentId) ? c.parentId : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent)!.push(c);
  }

  cache = {
    mtime,
    catalog,
    byId,
    bySlug: new Map(catalog.categories.map((c) => [c.slug, c])),
    children,
    productBySlug: new Map(catalog.products.map((p) => [p.slug, p])),
    productById: new Map(catalog.products.map((p) => [p.id, p])),
  };
  return cache;
}

export function getCatalogMeta() {
  const { catalog } = load();
  return { ...catalog.meta, productCount: catalog.products.length, categoryCount: catalog.categories.length };
}

export function getAllProducts(): Product[] {
  return load().catalog.products;
}

export function getAllCategories(): Category[] {
  return load().catalog.categories;
}

export function getRootCategories(): Category[] {
  return load().children.get(null) ?? [];
}

export function getChildCategories(id: string): Category[] {
  return load().children.get(id) ?? [];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return load().bySlug.get(slug);
}

export function getCategoryById(id: string | null | undefined): Category | undefined {
  return id ? load().byId.get(id) : undefined;
}

export function getCategoryPath(id: string | null | undefined): Category[] {
  const { byId } = load();
  const out: Category[] = [];
  const seen = new Set<string>();
  let cur = id ? byId.get(id) : undefined;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}

function descendantIds(id: string): Set<string> {
  const { children } = load();
  const out = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    for (const c of children.get(stack.pop()!) ?? []) {
      if (!out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

export function getProductsInCategory(id: string): Product[] {
  const ids = descendantIds(id);
  return getAllProducts().filter((p) => p.categoryId && ids.has(p.categoryId));
}

export function countProductsInCategory(id: string): number {
  return getProductsInCategory(id).length;
}

export function getProductBySlug(slug: string): Product | undefined {
  return load().productBySlug.get(slug);
}

export function getProductById(id: string): Product | undefined {
  return load().productById.get(id);
}

export function getRelatedProducts(product: Product, limit = 8): Product[] {
  if (!product.categoryId) return [];
  return getAllProducts()
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .sort((a, b) => Number(b.available === true) - Number(a.available === true))
    .slice(0, limit);
}

/** Марки авто з даних сумісності — для блоку «Підбір за маркою». */
export function getCarMakes(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of getAllProducts()) for (const m of p.carMakes) counts.set(m, (counts.get(m) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}
