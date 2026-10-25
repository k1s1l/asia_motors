"use client";
import { useSyncExternalStore } from "react";
import { MAX_QTY } from "./order";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  brand?: string;
  price: number;
  currency: string;
  image?: string;
  qty: number;
}

const KEY = "am-cart-v1";
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(raw)) items = raw.filter((x) => x && typeof x.id === "string" && x.qty > 0);
  } catch {
    items = EMPTY;
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // приватний режим або заповнене сховище — кошик живе до закриття вкладки
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    read();
    listeners.forEach((l) => l());
  });
}

const clamp = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n) || 1));

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    read();
    const existing = items.find((x) => x.id === item.id);
    commit(
      existing
        ? items.map((x) => (x.id === item.id ? { ...x, ...item, qty: clamp(x.qty + qty) } : x))
        : [...items, { ...item, qty: clamp(qty) }],
    );
  },
  setQty(id: string, qty: number) {
    read();
    commit(items.map((x) => (x.id === id ? { ...x, qty: clamp(qty) } : x)));
  },
  remove(id: string) {
    read();
    commit(items.filter((x) => x.id !== id));
  },
  clear() {
    commit([]);
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** null — кошик ще не прочитано (серверний рендер / перший кадр гідратації) */
export function useCart(): CartItem[] | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      read();
      return items;
    },
    () => null,
  );
}

export function cartTotals(list: CartItem[]) {
  return list.reduce(
    (acc, x) => ({ count: acc.count + x.qty, sum: Math.round((acc.sum + x.price * x.qty) * 100) / 100 }),
    { count: 0, sum: 0 },
  );
}
