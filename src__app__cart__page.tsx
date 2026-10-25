import type { Metadata } from "next";
import { CartView } from "./CartView";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Кошик", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Кошик" }]} />
      <h1 className="page__title">Кошик</h1>
      <CartView />
    </div>
  );
}
