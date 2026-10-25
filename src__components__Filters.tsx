"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Icon } from "./Icon";
import type { Facets, FacetOption } from "@/lib/listing";
import { toggleValue, withParams, type Params } from "@/lib/url";
import { formatPrice } from "@/lib/format";

interface Props {
  basePath: string;
  params: Params;
  facets: Facets;
  active: boolean;
  children?: ReactNode;
}

const OPEN_EVENT = "am:open-filters";

export function openFilters() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function FiltersToggle({ count }: { count: number }) {
  return (
    <button type="button" className="btn btn--ghost btn--sm filters-toggle" onClick={openFilters}>
      <Icon name="filter" size={16} /> Фільтри{count > 0 ? ` (${count})` : ""}
    </button>
  );
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="filter-group" open={defaultOpen}>
      <summary>
        {title} <Icon name="chevronDown" size={16} />
      </summary>
      {children}
    </details>
  );
}

export function Filters({ basePath, params, facets, active, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const first = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const [min, setMin] = useState(first("min"));
  const [max, setMax] = useState(first("max"));
  useEffect(() => {
    setMin(first("min"));
    setMax(first("max"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.min, params.max]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (changes: Params) => startTransition(() => router.push(withParams(basePath, params, changes), { scroll: false }));

  const options = (key: string, list: FacetOption[]) => (
    <div className="filter-group__list">
      {list.map((o) => {
        const raw = params[key];
        const checked = (Array.isArray(raw) ? raw : raw ? [raw] : []).includes(o.value);
        const disabled = !checked && o.count === 0;
        return (
          <label key={o.value} className={`check${disabled ? " check--disabled" : ""}`}>
            <input type="checkbox" checked={checked} disabled={disabled} onChange={() => go({ [key]: toggleValue(params, key, o.value) })} />
            <span>{o.value}</span>
            <span className="check__count">{o.count}</span>
          </label>
        );
      })}
    </div>
  );

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    let lo = min.trim() ? Math.max(0, Number(min)) : NaN;
    let hi = max.trim() ? Math.max(0, Number(max)) : NaN;
    if (!Number.isNaN(lo) && !Number.isNaN(hi) && lo > hi) [lo, hi] = [hi, lo];
    go({ min: Number.isNaN(lo) ? undefined : String(lo), max: Number.isNaN(hi) ? undefined : String(hi) });
  };

  const hasFacets = facets.brands.length || facets.makes.length || facets.params.length || facets.price || facets.hasStockData;

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} />}
      <aside className="sidebar" data-open={open} aria-label="Фільтри та категорії" aria-busy={pending}>
        <div className="side-block sidebar__close" style={{ display: "none", justifyContent: "space-between", alignItems: "center", padding: "8px 8px 8px 16px" }}>
          <strong>Фільтри</strong>
          <button type="button" className="icon-btn" aria-label="Закрити фільтри" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        {children}
        {hasFacets ? (
          <div className="side-block" style={{ opacity: pending ? 0.6 : 1, transition: "opacity .15s" }}>
            <p className="side-block__title">Фільтри</p>
            {facets.hasStockData && (
              <div className="filter-group">
                <label className="check">
                  <input type="checkbox" checked={first("stock") === "1"} onChange={(e) => go({ stock: e.target.checked ? "1" : undefined })} />
                  <span>Тільки в наявності</span>
                  <span className="check__count">{facets.inStockCount}</span>
                </label>
              </div>
            )}
            {facets.price && (
              <Group title="Ціна, ₴">
                <form className="price-range" onSubmit={applyPrice}>
                  <input className="input" inputMode="numeric" aria-label="Ціна від" placeholder={String(facets.price.min)} value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d.]/g, ""))} />
                  <span>—</span>
                  <input className="input" inputMode="numeric" aria-label="Ціна до" placeholder={String(facets.price.max)} value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d.]/g, ""))} />
                  <button type="submit" className="btn btn--dark btn--sm" style={{ gridColumn: "1 / -1" }}>Застосувати</button>
                </form>
                <p className="field__hint" style={{ marginTop: 6 }}>
                  Від {formatPrice(facets.price.min)} до {formatPrice(facets.price.max)}
                </p>
              </Group>
            )}
            {facets.makes.length > 0 && <Group title="Марка авто">{options("make", facets.makes)}</Group>}
            {facets.brands.length > 0 && <Group title="Виробник">{options("brand", facets.brands)}</Group>}
            {facets.params.map((p, i) => (
              <Group key={p.name} title={p.name} defaultOpen={i < 3 || params[`f_${p.name}`] !== undefined}>
                {options(`f_${p.name}`, p.options)}
              </Group>
            ))}
            {active && (
              <div className="filters__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => startTransition(() => router.push(withParams(basePath, { q: params.q, sort: params.sort, view: params.view }, {}), { scroll: false }))}
                >
                  Скинути фільтри
                </button>
              </div>
            )}
            <div className="filters__actions">
              <button type="button" className="btn btn--primary sidebar__apply" onClick={() => setOpen(false)}>Показати товари</button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

export function SortSelect({ basePath, params, value, options }: { basePath: string; params: Params; value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="sr-only">Сортування</span>
      <select
        className="select"
        value={value}
        onChange={(e) => router.push(withParams(basePath, params, { sort: e.target.value === "default" ? undefined : e.target.value }), { scroll: false })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
