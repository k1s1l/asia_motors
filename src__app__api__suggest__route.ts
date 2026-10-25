import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/catalog";
import { searchProducts } from "@/lib/listing";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ items: [], total: 0 });
  const found = searchProducts(getAllProducts(), q);
  return NextResponse.json({
    total: found.length,
    items: found.slice(0, 6).map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, brand: p.brand, price: p.price, currency: p.currency, image: p.images[0] })),
  });
}
