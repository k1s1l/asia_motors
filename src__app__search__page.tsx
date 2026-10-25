import type { Metadata } from "next";
import { getAllProducts } from "@/lib/catalog";
import { parseListQuery, searchProducts } from "@/lib/listing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingView } from "@/components/ListingView";
import type { Params } from "@/lib/url";

type Props = { searchParams: Promise<Params> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = parseListQuery(await searchParams).q;
  return { title: q ? `Пошук: ${q}` : "Усі товари", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = parseListQuery(sp);
  const all = getAllProducts();
  const products = query.q ? searchProducts(all, query.q) : all;
  const title = query.q ? `Результати пошуку «${query.q}»` : "Усі товари";

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: query.q ? "Пошук" : "Усі товари" }]} />
      <h1 className="page__title">{title}</h1>
      <ListingView
        basePath="/search"
        params={sp}
        query={query}
        products={products}
        emptyText={
          query.q
            ? "Перевірте написання або спробуйте шукати за артикулом, назвою деталі чи моделлю авто."
            : "Каталог ще не наповнено товарами."
        }
      />
    </div>
  );
}
