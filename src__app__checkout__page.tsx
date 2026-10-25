import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { isOrderingEnabled } from "@/lib/order-delivery";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Оформлення замовлення", robots: { index: false } };

export default function CheckoutPage() {
  const store = getStore();
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Кошик", href: "/cart" }, { label: "Оформлення замовлення" }]} />
      <h1 className="page__title">Оформлення замовлення</h1>
      <CheckoutForm
        enabled={isOrderingEnabled()}
        deliveryMethods={store.deliveryMethods}
        paymentMethods={store.paymentMethods}
        phones={store.phones}
        hasDeliveryPage={store.pages.some((p) => p.slug === "delivery")}
      />
    </div>
  );
}
