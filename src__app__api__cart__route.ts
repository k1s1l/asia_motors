import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";

/** Актуальні ціни й наявність для товарів кошика (ціни в localStorage могли застаріти). */
export async function POST(req: Request) {
  let ids: unknown;
  try {
    ids = (await req.json())?.ids;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length > 200) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const items = Object.fromEntries(
    ids.filter((x): x is string => typeof x === "string").map((id) => {
      const p = getProductById(id);
      return [id, p ? { exists: true, price: p.price, available: p.available, name: p.name } : { exists: false }];
    }),
  );
  return NextResponse.json({ items });
}
