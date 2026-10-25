"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import { formatPrice } from "@/lib/format";
import { productHref } from "@/lib/routes";

interface Suggestion {
  slug: string;
  name: string;
  sku?: string;
  brand?: string;
  price: number | null;
  currency: string;
  image?: string;
}

export function SearchBox({ className = "", large = false }: { className?: string; large?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(pathname === "/search" ? params.get("q") ?? "" : "");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [failed, setFailed] = useState(false);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    if (pathname !== "/search") setQ("");
  }, [pathname]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setFailed(false);
        setCursor(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFailed(true);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (cursor >= 0 && items?.[cursor]) {
      router.push(productHref(items[cursor].slug));
      return;
    }
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!items?.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => (c + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c <= 0 ? items.length - 1 : c - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && q.trim().length >= 2 && (items !== null || failed);

  return (
    <div className={`search ${className}`} ref={boxRef}>
      <form className="search__form" role="search" action="/search" onSubmit={submit}>
        <label htmlFor={`${listId}-input`} className="sr-only">Пошук запчастин</label>
        <input
          id={`${listId}-input`}
          className="search__input"
          type="search"
          name="q"
          value={q}
          autoComplete="off"
          placeholder="Назва запчастини, артикул або модель авто"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={cursor >= 0 ? `${listId}-${cursor}` : undefined}
        />
        <button className="search__submit" type="submit" aria-label="Шукати">
          <Icon name="search" />
          {large && <span>Знайти</span>}
        </button>
      </form>
      {showDropdown && (
        <div className="search__dropdown" id={listId} role="listbox">
          {failed ? (
            <p className="search__empty">Не вдалося виконати пошук. Спробуйте ще раз.</p>
          ) : items!.length === 0 ? (
            <p className="search__empty">За запитом «{q.trim()}» нічого не знайдено.</p>
          ) : (
            <>
              {items!.map((it, i) => (
                <Link
                  key={it.slug}
                  id={`${listId}-${i}`}
                  href={productHref(it.slug)}
                  className="search__item"
                  role="option"
                  aria-selected={i === cursor}
                >
                  {it.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="search__thumb" src={it.image} alt="" loading="lazy" />
                  ) : (
                    <span className="search__thumb" />
                  )}
                  <span>
                    <span className="search__name">{it.name}</span>
                    {(it.sku || it.brand) && (
                      <span className="search__sku">{[it.brand, it.sku && `арт. ${it.sku}`].filter(Boolean).join(" · ")}</span>
                    )}
                  </span>
                  <span className="search__price">{it.price !== null ? formatPrice(it.price, it.currency) : ""}</span>
                </Link>
              ))}
              <Link href={`/search?q=${encodeURIComponent(q.trim())}`} className="search__all">
                Усі результати ({total}) →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
