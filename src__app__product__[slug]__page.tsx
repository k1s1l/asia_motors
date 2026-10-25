import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPath, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getStore, SITE_URL } from "@/lib/store";
import { categoryHref, infoHref, productHref } from "@/lib/routes";
import { toCartPayload } from "@/lib/cart-payload";
import { telHref } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Gallery } from "@/components/Gallery";
import { Price, discountPercent } from "@/components/Price";
import { StockBadge } from "@/components/StockBadge";
import { BuyBlock } from "@/components/AddToCart";
import { Tabs } from "@/components/Tabs";
import { CopyText } from "@/components/CopyText";
import { ProductGrid } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

const stripTags = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProductBySlug(decodeURIComponent((await params).slug));
  if (!p) return { title: "Товар не знайдено" };
  const desc = stripTags(p.descriptionHtml).slice(0, 160) || [p.name, p.brand, p.sku && `арт. ${p.sku}`].filter(Boolean).join(", ");
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: productHref(p.slug) },
    openGraph: { title: p.name, description: desc, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = getProductBySlug(decodeURIComponent((await params).slug));
  if (!p) notFound();
  const store = getStore();
  const path = getCategoryPath(p.categoryId);
  const related = getRelatedProducts(p);
  const discount = discountPercent(p.price, p.oldPrice);
  const infoLinks = ["delivery", "payment", "warranty", "returns"]
    .map((slug) => store.pages.find((x) => x.slug === slug))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.sku ? { sku: p.sku, mpn: p.sku } : {}),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.images.length ? { image: p.images } : {}),
    ...(p.descriptionHtml ? { description: stripTags(p.descriptionHtml).slice(0, 500) } : {}),
    ...(p.price !== null
      ? {
          offers: {
            "@type": "Offer",
            url: SITE_URL + productHref(p.slug),
            price: p.price,
            priceCurrency: p.currency,
            ...(p.available !== null ? { availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } : {}),
          },
        }
      : {}),
  };

  const tabs = [
    p.descriptionHtml && { id: "desc", label: "Опис", content: <div className="prose" dangerouslySetInnerHTML={{ __html: p.descriptionHtml }} /> },
    p.params.length > 0 && {
      id: "specs",
      label: "Характеристики",
      count: p.params.length,
      content: (
        <table className="specs">
          <tbody>
            {p.params.map((x, i) => (
              <tr key={i}>
                <th scope="row">{x.name}</th>
                <td>{x.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    p.compatibility.length > 0 && {
      id: "compat",
      label: "Сумісність",
      count: p.compatibility.length,
      content: (
        <>
          <ul className="compat">
            {p.compatibility.map((c) => (
              <li key={c}><Icon name="car" size={18} /> {c}</li>
            ))}
          </ul>
          <p className="field__hint" style={{ marginTop: 14 }}>Сумісність вказана за даними каталогу. Для точного підбору вкажіть VIN-код при оформленні замовлення.</p>
        </>
      ),
    },
  ].filter(Boolean) as { id: string; label: string; count?: number; content: React.ReactNode }[];

  return (
    <div className="container page">
      <Breadcrumbs
        items={[{ label: "Каталог", href: "/catalog" }, ...path.map((c) => ({ label: c.name, href: categoryHref(c.slug) })), { label: p.name }]}
      />
      <h1 className="product__title">{p.name}</h1>
      <div className="product">
        <Gallery images={p.images} alt={p.name} />
        <div className="buybox panel">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StockBadge available={p.available} text={p.stockText} />
            {discount !== null && <span className="badge badge--sale">−{discount}%</span>}
          </div>
          {(p.sku || p.brand || path.length > 0) && (
            <dl className="buybox__facts">
              {p.sku && (<><dt>Артикул</dt><dd><CopyText text={p.sku} /></dd></>)}
              {p.brand && (<><dt>Виробник</dt><dd>{p.brand}</dd></>)}
              {path.length > 0 && (<><dt>Категорія</dt><dd><Link href={categoryHref(path[path.length - 1].slug)} style={{ color: "var(--brand)" }}>{path[path.length - 1].name}</Link></dd></>)}
              {p.carMakes.length > 0 && (<><dt>Марка авто</dt><dd>{p.carMakes.join(", ")}</dd></>)}
            </dl>
          )}
          <div className="buybox__price">
            <Price price={p.price} oldPrice={p.oldPrice} currency={p.currency} />
          </div>
          <BuyBlock item={toCartPayload(p)} available={p.available} />
          {store.phones[0] && (
            <p className="buybox__note">
              Потрібна консультація щодо підбору? Телефонуйте: <a href={telHref(store.phones[0])} style={{ fontWeight: 700, color: "var(--ink)" }}>{store.phones[0]}</a>
            </p>
          )}
          {infoLinks.length > 0 && (
            <div className="buybox__links">
              {infoLinks.map((x) => (
                <Link key={x.slug} href={infoHref(x.slug)}><Icon name="info" size={18} /> {x.title}</Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Tabs tabs={tabs} />
      {related.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Інші товари з категорії</h2>
            {path.length > 0 && <Link href={categoryHref(path[path.length - 1].slug)} className="section__link">Усі <Icon name="arrowRight" size={16} /></Link>}
          </div>
          <ProductGrid products={related.slice(0, 5)} />
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </div>
  );
}
