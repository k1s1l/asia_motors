import Link from "next/link";
import type { Product } from "@/lib/types";
import { productHref } from "@/lib/routes";
import { toCartPayload } from "@/lib/cart-payload";
import { ProductImage } from "./ProductImage";
import { Price, discountPercent } from "./Price";
import { StockBadge } from "./StockBadge";
import { AddToCartButton } from "./AddToCart";

export function ProductCard({ product: p, eager = false }: { product: Product; eager?: boolean }) {
  const discount = discountPercent(p.price, p.oldPrice);
  return (
    <article className="card">
      <div className="card__media">
        <ProductImage src={p.images[0]} alt={p.name} eager={eager} />
        <div className="card__badges">
          {discount !== null && <span className="badge badge--sale">−{discount}%</span>}
        </div>
      </div>
      <div className="card__body">
        <div className="card__meta">
          {p.sku && <span>Арт. <b>{p.sku}</b></span>}
          {p.brand && <span>{p.brand}</span>}
        </div>
        <h3 className="card__title">
          <Link href={productHref(p.slug)}>{p.name}</Link>
        </h3>
        {p.compatibility.length > 0 && <p className="card__compat">Для: {p.compatibility.join(", ")}</p>}
        <div className="card__badges" style={{ position: "static" }}>
          <StockBadge available={p.available} text={p.stockText} />
        </div>
      </div>
      <div className="card__foot">
        <Price price={p.price} oldPrice={p.oldPrice} currency={p.currency} />
        <AddToCartButton item={toCartPayload(p)} available={p.available} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, view = "grid", eagerCount = 0 }: { products: Product[]; view?: "grid" | "list"; eagerCount?: number }) {
  return (
    <div className={view === "list" ? "rows" : "grid"}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} eager={i < eagerCount} />
      ))}
    </div>
  );
}
