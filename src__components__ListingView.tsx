import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "@/lib/types";
import { SORT_OPTIONS, applyListQuery, buildFacets, hasActiveFilters, paramKey, type ListQuery } from "@/lib/listing";
import { toggleValue, withParams, type Params } from "@/lib/url";
import { formatPrice, productsWord } from "@/lib/format";
import { Filters, FiltersToggle, SortSelect } from "./Filters";
import { ProductGrid } from "./ProductCard";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";

interface Props {
  basePath: string;
  params: Params;
  query: ListQuery;
  products: Product[];
  sidebarTop?: ReactNode;
  emptyText?: ReactNode;
}

function Chips({ basePath, params, query }: { basePath: string; params: Params; query: ListQuery }) {
  const chips: { label: string; href: string }[] = [];
  for (const b of query.brands) chips.push({ label: b, href: withParams(basePath, params, { brand: toggleValue(params, "brand", b) }) });
  for (const m of query.makes) chips.push({ label: m, href: withParams(basePath, params, { make: toggleValue(params, "make", m) }) });
  for (const [name, values] of Object.entries(query.params))
    for (const v of values) chips.push({ label: `${name}: ${v}`, href: withParams(basePath, params, { [paramKey(name)]: toggleValue(params, paramKey(name), v) }) });
  if (query.inStock) chips.push({ label: "В наявності", href: withParams(basePath, params, { stock: undefined }) });
  if (query.min !== null || query.max !== null)
    chips.push({
      label: `Ціна: ${query.min !== null ? `від ${formatPrice(query.min)}` : ""} ${query.max !== null ? `до ${formatPrice(query.max)}` : ""}`.trim(),
      href: withParams(basePath, params, { min: undefined, max: undefined }),
    });
  if (!chips.length) return null;
  return (
    <div className="chips" aria-label="Обрані фільтри">
      {chips.map((c) => (
        <Link key={c.href + c.label} href={c.href} className="chip" scroll={false} aria-label={`Прибрати фільтр ${c.label}`}>
          {c.label} <Icon name="close" size={14} />
        </Link>
      ))}
      <Link href={withParams(basePath, { q: params.q, sort: params.sort, view: params.view }, {})} className="chip chip--reset" scroll={false}>
        Скинути все
      </Link>
    </div>
  );
}

function Pagination({ basePath, params, page, pages }: { basePath: string; params: Params; page: number; pages: number }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...nums].sort((a, b) => a - b);
  const href = (n: number) => withParams(basePath, params, { page: n === 1 ? undefined : String(n) });
  return (
    <nav className="pagination" aria-label="Сторінки">
      {page > 1 && <Link href={href(page - 1)} aria-label="Попередня сторінка"><Icon name="chevronLeft" size={18} /></Link>}
      {sorted.map((n, i) => (
        <span key={n} style={{ display: "contents" }}>
          {i > 0 && n - sorted[i - 1] > 1 && <span className="gap">…</span>}
          {n === page ? <span aria-current="page">{n}</span> : <Link href={href(n)}>{n}</Link>}
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)} aria-label="Наступна сторінка"><Icon name="chevronRight" size={18} /></Link>}
    </nav>
  );
}

export function ListingView({ basePath, params, query, products, sidebarTop, emptyText }: Props) {
  const facets = buildFacets(products, query);
  const result = applyListQuery(products, query);
  const active = hasActiveFilters(query);
  const view = params.view === "list" ? "list" : "grid";
  const activeCount =
    query.brands.length + query.makes.length + Object.values(query.params).flat().length + Number(query.inStock) + Number(query.min !== null || query.max !== null);

  return (
    <div className="listing">
      <Filters basePath={basePath} params={params} facets={facets} active={active}>
        {sidebarTop}
      </Filters>
      <div>
        <div className="toolbar panel">
          <span className="toolbar__count">
            Знайдено <b>{productsWord(result.total)}</b>
          </span>
          <div className="toolbar__right">
            <FiltersToggle count={activeCount} />
            <SortSelect basePath={basePath} params={params} value={query.sort} options={SORT_OPTIONS} />
            <div className="view-switch" role="group" aria-label="Вигляд списку">
              <Link href={withParams(basePath, params, { view: undefined }, true)} aria-current={view === "grid"} aria-label="Плиткою" scroll={false}>
                <Icon name="grid" size={18} />
              </Link>
              <Link href={withParams(basePath, params, { view: "list" }, true)} aria-current={view === "list"} aria-label="Списком" scroll={false}>
                <Icon name="list" size={18} />
              </Link>
            </div>
          </div>
        </div>
        <Chips basePath={basePath} params={params} query={query} />
        {result.items.length ? (
          <>
            <ProductGrid products={result.items} view={view} eagerCount={4} />
            <Pagination basePath={basePath} params={params} page={result.page} pages={result.pages} />
          </>
        ) : active ? (
          <EmptyState icon="filter" title="Нічого не знайдено" text="Жоден товар не відповідає обраним фільтрам. Спробуйте змінити або скинути їх.">
            <Link className="btn btn--primary" href={withParams(basePath, { q: params.q }, {})}>Скинути фільтри</Link>
          </EmptyState>
        ) : (
          <EmptyState title="Товарів поки немає" text={emptyText ?? "У цьому розділі ще немає товарів."}>
            <Link className="btn btn--primary" href="/catalog">До каталогу</Link>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
