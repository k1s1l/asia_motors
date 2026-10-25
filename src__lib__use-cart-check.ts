"use client";
import { useEffect, useState } from "react";
import { cart, type CartItem } from "./cart";

export type CartIssue = "removed" | "unavailable" | "no_price" | "price_changed";

/** Звіряє кошик з актуальним каталогом і оновлює ціни. */
export function useCartCheck(items: CartItem[] | null) {
  const [issues, setIssues] = useState<Record<string, CartIssue>>({});
  const [checked, setChecked] = useState(false);
  const key = items?.map((x) => x.id).join("|") ?? null;

  useEffect(() => {
    if (key === null) return;
    if (!key) {
      setIssues({});
      setChecked(true);
      return;
    }
    let cancelled = false;
    fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: key.split("|") }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ items: fresh }) => {
        if (cancelled) return;
        const next: Record<string, CartIssue> = {};
        for (const item of items!) {
          const f = fresh[item.id];
          if (!f?.exists) next[item.id] = "removed";
          else if (f.available === false) next[item.id] = "unavailable";
          else if (f.price === null) next[item.id] = "no_price";
          else if (f.price !== item.price) {
            next[item.id] = "price_changed";
            cart.add({ ...item, price: f.price }, 0);
          }
        }
        setIssues(next);
        setChecked(true);
      })
      .catch(() => !cancelled && setChecked(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { issues, checked };
}

export const ISSUE_TEXT: Record<CartIssue, string> = {
  removed: "Товар більше не доступний у каталозі — видаліть його з кошика.",
  unavailable: "Товару зараз немає в наявності — видаліть його з кошика.",
  no_price: "Ціна товару наразі не вказана — видаліть його або уточніть у менеджера.",
  price_changed: "Ціну оновлено відповідно до каталогу.",
};

export const isBlocking = (i?: CartIssue) => i === "removed" || i === "unavailable" || i === "no_price";
