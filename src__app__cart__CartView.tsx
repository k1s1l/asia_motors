"use client";
import Link from "next/link";
import { cart, cartTotals, useCart } from "@/lib/cart";
import { ISSUE_TEXT, isBlocking, useCartCheck } from "@/lib/use-cart-check";
import { formatPrice, productsWord } from "@/lib/format";
import { productHref } from "@/lib/routes";
import { QtyStepper } from "@/components/QtyStepper";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

export function CartView() {
  const items = useCart();
  const { issues } = useCartCheck(items);

  if (items === null) {
    return (
      <div className="cart-layout" aria-busy="true">
        <div className="panel skeleton" style={{ height: 260 }} />
        <div className="panel skeleton" style={{ height: 220 }} />
      </div>
    );
  }
  if (!items.length) {
    return (
      <EmptyState icon="cart" title="Кошик порожній" text="Додайте потрібні запчастини з каталогу або скористайтеся пошуком за артикулом.">
        <Link href="/catalog" className="btn btn--primary">Перейти до каталогу</Link>
      </EmptyState>
    );
  }

  const { count, sum } = cartTotals(items);
  const blocked = items.some((x) => isBlocking(issues[x.id]));

  return (
    <div className="cart-layout">
      <div className="panel">
        <div className="cart-list">
          {items.map((it) => {
            const issue = issues[it.id];
            return (
              <div className="cart-item" key={it.id}>
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="cart-item__img" src={it.image} alt="" loading="lazy" />
                ) : (
                  <span className="cart-item__img" style={{ display: "grid", placeItems: "center", color: "var(--line-2)" }}><Icon name="image" /></span>
                )}
                <div>
                  <Link href={productHref(it.slug)} className="cart-item__name">{it.name}</Link>
                  <p className="cart-item__meta">{[it.brand, it.sku && `арт. ${it.sku}`].filter(Boolean).join(" · ")}</p>
                  <p className="cart-item__unit">{formatPrice(it.price, it.currency)} / шт.</p>
                </div>
                <div className="cart-item__qty">
                  <QtyStepper small value={it.qty} onChange={(n) => cart.setQty(it.id, n)} label={`Кількість: ${it.name}`} />
                </div>
                <div className="cart-item__sum">{formatPrice(Math.round(it.price * it.qty * 100) / 100, it.currency)}</div>
                <button type="button" className="cart-item__remove" aria-label={`Видалити ${it.name}`} onClick={() => cart.remove(it.id)}>
                  <Icon name="trash" size={18} />
                </button>
                {issue && (
                  <p className="cart-item__warn" role="status" style={issue === "price_changed" ? { color: "var(--muted)" } : undefined}>
                    {ISSUE_TEXT[issue]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <aside className="summary panel" aria-label="Підсумок замовлення">
        <h2>Ваше замовлення</h2>
        <div className="summary__row"><span>Товари</span><span>{productsWord(count)}</span></div>
        <div className="summary__total"><span>Разом</span><b>{formatPrice(sum)}</b></div>
        {blocked && <div className="notice notice--warn"><Icon name="alert" /><span>Деякі товари недоступні для замовлення. Видаліть їх, щоб продовжити.</span></div>}
        {blocked ? (
          <button type="button" className="btn btn--primary btn--lg btn--block" disabled>Оформити замовлення</button>
        ) : (
          <Link href="/checkout" className="btn btn--primary btn--lg btn--block">Оформити замовлення</Link>
        )}
        <Link href="/catalog" className="btn btn--ghost btn--block">Продовжити покупки</Link>
        <button type="button" className="btn btn--sm" style={{ background: "none", color: "var(--muted)" }} onClick={() => confirm("Очистити кошик?") && cart.clear()}>
          Очистити кошик
        </button>
      </aside>
    </div>
  );
}
