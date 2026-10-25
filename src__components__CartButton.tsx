"use client";
import Link from "next/link";
import { Icon } from "./Icon";
import { cartTotals, useCart } from "@/lib/cart";

export function CartButton() {
  const items = useCart();
  const count = items ? cartTotals(items).count : 0;
  return (
    <Link href="/cart" className="icon-btn" aria-label={`Кошик, товарів: ${count}`}>
      <Icon name="cart" size={24} />
      <span className="icon-btn__label">Кошик</span>
      {count > 0 && <span className="icon-btn__badge">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
