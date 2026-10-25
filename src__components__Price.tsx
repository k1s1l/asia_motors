import { formatPrice } from "@/lib/format";

export function Price({ price, oldPrice, currency }: { price: number | null; oldPrice?: number; currency: string }) {
  if (price === null) return <span className="price__none">Ціну уточнюйте</span>;
  const sale = oldPrice !== undefined && oldPrice > price;
  return (
    <span className="price">
      {sale && <span className="price__old">{formatPrice(oldPrice, currency)}</span>}
      <span className={`price__now${sale ? " price__now--sale" : ""}`}>{formatPrice(price, currency)}</span>
    </span>
  );
}

export function discountPercent(price: number | null, oldPrice?: number) {
  if (price === null || !oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}
