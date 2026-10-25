import type { Product } from "./types";
import type { CartItem } from "./cart";

/** Дані для кошика. Товар без ціни купити онлайн не можна — повертається null. */
export function toCartPayload(p: Product): Omit<CartItem, "qty"> | null {
  if (p.price === null) return null;
  return { id: p.id, slug: p.slug, name: p.name, sku: p.sku, brand: p.brand, price: p.price, currency: p.currency, image: p.images[0] };
}
