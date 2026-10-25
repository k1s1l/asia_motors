"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { cart, cartTotals, useCart } from "@/lib/cart";
import { isBlocking, useCartCheck } from "@/lib/use-cart-check";
import { validateOrder, type OrderErrors, type OrderForm } from "@/lib/order";
import { formatPrice, productsWord, telHref } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

interface Props {
  enabled: boolean;
  deliveryMethods: string[];
  paymentMethods: string[];
  phones: string[];
  hasDeliveryPage: boolean;
}

const EMPTY: OrderForm = { name: "", phone: "", email: "", city: "", delivery: "", payment: "", comment: "", vin: "" };

const SERVER_ERRORS: Record<string, string> = {
  not_configured: "Онлайн-оформлення замовлень ще не підключене.",
  rate_limited: "Забагато спроб. Зачекайте хвилину й спробуйте знову.",
  unavailable_items: "Деякі товари стали недоступні. Поверніться в кошик, щоб перевірити замовлення.",
  empty_cart: "Кошик порожній.",
  delivery_failed: "Не вдалося передати замовлення менеджеру. Спробуйте ще раз або зателефонуйте нам.",
};

function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}{required && <em> *</em>}</label>
      {children}
      {error ? (
        <span className="field__error" id={`${id}-err`}><Icon name="alert" size={14} />{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function CheckoutForm({ enabled, deliveryMethods, paymentMethods, phones, hasDeliveryPage }: Props) {
  const items = useCart();
  const { issues } = useCartCheck(items);
  const [form, setForm] = useState<OrderForm>(EMPTY);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number: string; total: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const options = { deliveryMethods, paymentMethods };

  const set = (k: keyof OrderForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (touched) setErrors(validateOrder(next, options));
  };

  if (done) {
    return (
      <EmptyState icon="check" title={`Замовлення №${done.number} прийнято`} text={<>Сума: <b>{formatPrice(done.total)}</b>. Менеджер зв’яжеться з вами для підтвердження наявності, доставки та оплати.</>}>
        <Link href="/catalog" className="btn btn--primary">Повернутися до каталогу</Link>
      </EmptyState>
    );
  }
  if (items === null) return <div className="panel skeleton" style={{ height: 420 }} aria-busy="true" />;
  if (!items.length) {
    return (
      <EmptyState icon="cart" title="Кошик порожній" text="Щоб оформити замовлення, спочатку додайте товари в кошик.">
        <Link href="/catalog" className="btn btn--primary">До каталогу</Link>
      </EmptyState>
    );
  }

  const { count, sum } = cartTotals(items);
  const blocked = items.some((x) => isBlocking(issues[x.id]));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    const errs = validateOrder(form, options);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          lines: items!.map((x) => ({ id: x.id, qty: x.qty })),
          website: (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        cart.clear();
        setDone({ number: data.number, total: data.total });
        window.scrollTo({ top: 0 });
      } else if (data.error === "validation") {
        setErrors(data.errors ?? {});
        setServerError("Перевірте правильність заповнення полів.");
      } else {
        setServerError(SERVER_ERRORS[data.error] ?? "Сталася помилка. Спробуйте ще раз.");
      }
    } catch {
      setServerError("Немає з’єднання з сервером. Перевірте інтернет і спробуйте ще раз.");
    } finally {
      setSending(false);
    }
  }

  const inv = (k: keyof OrderForm) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `co-${k}-err` : undefined });

  return (
    <form ref={formRef} className="cart-layout" onSubmit={submit} noValidate>
      <div className="checkout">
        {!enabled && (
          <div className="notice notice--warn" role="alert">
            <Icon name="alert" />
            <span>
              <b>Онлайн-оформлення ще не підключене.</b> Заповнена форма зараз нікуди не надсилається, тому кнопку відправлення вимкнено.
              {phones[0] && <> Щоб замовити, зателефонуйте: <a href={telHref(phones[0])} style={{ fontWeight: 700 }}>{phones[0]}</a>.</>}
            </span>
          </div>
        )}
        <section className="checkout__step panel">
          <h2><span className="checkout__num">1</span> Контактні дані</h2>
          <div className="form-grid">
            <Field id="co-name" label="Ім’я та прізвище" required error={errors.name}>
              <input id="co-name" name="name" className="input" autoComplete="name" value={form.name} onChange={set("name")} {...inv("name")} />
            </Field>
            <Field id="co-phone" label="Телефон" required error={errors.phone}>
              <input id="co-phone" name="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380" value={form.phone} onChange={set("phone")} {...inv("phone")} />
            </Field>
            <Field id="co-email" label="E-mail" error={errors.email} hint="Необов’язково">
              <input id="co-email" name="email" className="input" type="email" autoComplete="email" value={form.email} onChange={set("email")} {...inv("email")} />
            </Field>
            <Field id="co-vin" label="VIN-код авто" error={errors.vin} hint="Необов’язково — допоможе перевірити сумісність">
              <input id="co-vin" name="vin" className="input" autoCapitalize="characters" maxLength={17} value={form.vin} onChange={set("vin")} {...inv("vin")} />
            </Field>
          </div>
        </section>

        <section className="checkout__step panel">
          <h2><span className="checkout__num">2</span> Доставка</h2>
          <div className="form-grid">
            <Field id="co-city" label="Місто" required error={errors.city}>
              <input id="co-city" name="city" className="input" autoComplete="address-level2" value={form.city} onChange={set("city")} {...inv("city")} />
            </Field>
            {deliveryMethods.length > 0 && (
              <div className="field span-2" role="radiogroup" aria-labelledby="co-delivery-l">
                <span className="field__label" id="co-delivery-l">Спосіб доставки <em>*</em></span>
                <div className="options">
                  {deliveryMethods.map((m) => (
                    <label key={m} className="option">
                      <input type="radio" name="delivery" value={m} checked={form.delivery === m} onChange={set("delivery")} />
                      {m}
                    </label>
                  ))}
                </div>
                {errors.delivery && <span className="field__error"><Icon name="alert" size={14} />{errors.delivery}</span>}
              </div>
            )}
          </div>
          {deliveryMethods.length === 0 && (
            <p className="field__hint" style={{ marginTop: 12 }}>
              Спосіб і вартість доставки менеджер узгодить з вами після оформлення.
              {hasDeliveryPage && <> Детальніше — <Link href="/info/delivery" style={{ color: "var(--brand)" }}>умови доставки</Link>.</>}
            </p>
          )}
        </section>

        {paymentMethods.length > 0 && (
          <section className="checkout__step panel">
            <h2><span className="checkout__num">3</span> Оплата</h2>
            <div className="options" role="radiogroup" aria-label="Спосіб оплати">
              {paymentMethods.map((m) => (
                <label key={m} className="option">
                  <input type="radio" name="payment" value={m} checked={form.payment === m} onChange={set("payment")} />
                  {m}
                </label>
              ))}
            </div>
            {errors.payment && <span className="field__error" style={{ marginTop: 8 }}><Icon name="alert" size={14} />{errors.payment}</span>}
          </section>
        )}

        <section className="checkout__step panel">
          <h2><span className="checkout__num">{paymentMethods.length ? 4 : 3}</span> Коментар</h2>
          <Field id="co-comment" label="Коментар до замовлення" error={errors.comment}>
            <textarea id="co-comment" name="comment" className="textarea" maxLength={1000} value={form.comment} onChange={set("comment")} {...inv("comment")} />
          </Field>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
        </section>
      </div>

      <aside className="summary panel" aria-label="Ваше замовлення">
        <h2>Ваше замовлення</h2>
        <div className="summary__lines">
          {items.map((x) => (
            <div key={x.id} className="summary__line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.image ? <img src={x.image} alt="" loading="lazy" /> : <span />}
              <span>{x.name}<br /><span style={{ color: "var(--muted)" }}>{x.qty} × {formatPrice(x.price, x.currency)}</span></span>
              <b>{formatPrice(Math.round(x.price * x.qty * 100) / 100, x.currency)}</b>
            </div>
          ))}
        </div>
        <div className="summary__row"><span>Товари</span><span>{productsWord(count)}</span></div>
        <div className="summary__total"><span>До сплати</span><b>{formatPrice(sum)}</b></div>
        {blocked && (
          <div className="notice notice--warn"><Icon name="alert" /><span>У кошику є недоступні товари. <Link href="/cart" style={{ fontWeight: 700 }}>Повернутися в кошик</Link></span></div>
        )}
        {serverError && <div className="notice notice--error" role="alert"><Icon name="alert" /><span>{serverError}</span></div>}
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={!enabled || blocked || sending}>
          {sending ? <><span className="spinner" /> Надсилаємо…</> : "Підтвердити замовлення"}
        </button>
        <Link href="/cart" className="btn btn--ghost btn--block">Змінити кошик</Link>
      </aside>
    </form>
  );
}
