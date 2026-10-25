"use client";
import { useState } from "react";
import { Icon } from "./Icon";
import { QtyStepper } from "./QtyStepper";
import { cart, useCart, type CartItem } from "@/lib/cart";
import { toast } from "./Toast";

type Payload = Omit<CartItem, "qty">;

function canBuy(item: Payload | null, available: boolean | null) {
  return item !== null && available !== false;
}

/** Компактна кнопка для карток у списку */
export function AddToCartButton({ item, available }: { item: Payload | null; available: boolean | null }) {
  const items = useCart();
  const inCart = items?.some((x) => x.id === item?.id);
  if (!canBuy(item, available)) {
    return (
      <button type="button" className="btn btn--ghost btn--sm" disabled title={item ? "Немає в наявності" : "Ціна не вказана"}>
        {item ? "Немає" : "Під замовлення"}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`btn btn--sm ${inCart ? "btn--dark" : "btn--primary"}`}
      aria-label={inCart ? `Додати ще: ${item!.name}` : `Купити: ${item!.name}`}
      onClick={() => {
        cart.add(item!);
        toast("Товар додано в кошик", true);
      }}
    >
      <Icon name={inCart ? "check" : "cart"} size={18} />
      {inCart ? "В кошику" : "Купити"}
    </button>
  );
}

/** Блок покупки на сторінці товару */
export function BuyBlock({ item, available }: { item: Payload | null; available: boolean | null }) {
  const [qty, setQty] = useState(1);
  const items = useCart();
  const inCart = items?.find((x) => x.id === item?.id);

  if (!canBuy(item, available)) {
    return (
      <div className="notice">
        <Icon name="info" />
        <span>
          {item ? "Товару немає в наявності, тому його не можна додати в кошик." : "Ціна товару не вказана в каталозі — уточніть її в менеджера."}
        </span>
      </div>
    );
  }
  return (
    <div className="buybox__buy">
      <QtyStepper value={qty} onChange={setQty} label={`Кількість: ${item!.name}`} />
      <button
        type="button"
        className="btn btn--primary btn--lg"
        onClick={() => {
          cart.add(item!, qty);
          toast(`Додано в кошик: ${qty} шт.`, true);
          setQty(1);
        }}
      >
        <Icon name="cart" /> Додати в кошик
      </button>
      {inCart && (
        <p className="buybox__note" style={{ flexBasis: "100%" }}>
          У кошику вже {inCart.qty} шт. — <a href="/cart" style={{ color: "var(--brand)", fontWeight: 700 }}>оформити замовлення</a>
        </p>
      )}
    </div>
  );
}
