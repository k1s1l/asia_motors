import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategoryPath, getChildCategories, getProductsInCategory, countProductsInCategory, getCategoryById } from "@/lib/catalog";
import { parseListQuery } from "@/lib/listing";
import { categoryHref } from "@/lib/routes";
import { productsWord } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingView } from "@/components/ListingView";
import { Icon } from "@/components/Icon";
import type { Params } from "@/lib/url";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Params> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const category = getCategoryBySlug(decodeURIComponent((await params).slug));
  if (!category) return { title: "Категорію не знайдено" };
  const sp = await searchParams;
  const filtered = Object.keys(sp).some((k) => k !== "page");
  return {
    title: category.name,
    description: `${category.name}: ${productsWord(countProductsInCategory(category.id))} в каталозі.`,
    alternates: { canonical: categoryHref(category.slug) },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = getCategoryBySlug(decodeURIComponent((await params).slug));
  if (!category) notFound();
  const sp = await searchParams;
  const path = getCategoryPath(category.id);
  const children = getChildCategories(category.id).map((c) => ({ ...c, count: countProductsInCategory(c.id) })).filter((c) => c.count > 0);
  const parent = getCategoryById(category.parentId);
  const siblings = children.length
    ? []
    : (parent ? getChildCategories(parent.id) : []).map((c) => ({ ...c, count: countProductsInCategory(c.id) })).filter((c) => c.count > 0);
  const products = getProductsInCategory(category.id);
  const basePath = categoryHref(category.slug);

  const sideList = children.length ? children : siblings;

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Каталог", href: "/catalog" },
          ...path.map((c, i) => ({ label: c.name, href: i < path.length - 1 ? categoryHref(c.slug) : undefined })),
        ]}
      />
      <h1 className="page__title">
        {category.name} <small>{productsWord(products.length)}</small>
      </h1>
      {children.length > 0 && (
        <nav className="subcats" aria-label="Підкатегорії">
          {children.map((c) => (
            <Link key={c.id} href={categoryHref(c.slug)} className="subcat">
              {c.name} <span>{c.count}</span>
            </Link>
          ))}
        </nav>
      )}
      <ListingView
        basePath={basePath}
        params={sp}
        query={parseListQuery(sp)}
        products={products}
        sidebarTop={
          <div className="side-block side-cats">
            <Link href={parent ? categoryHref(parent.slug) : "/catalog"} className="side-cats__back">
              <Icon name="chevronLeft" size={16} /> {parent ? parent.name : "Весь каталог"}
            </Link>
            {sideList.length > 0 && (
              <ul style={{ marginTop: 6 }}>
                {sideList.map((c) => (
                  <li key={c.id}>
                    <Link href={categoryHref(c.slug)} aria-current={c.id === category.id ? "page" : undefined}>
                      {c.name} <span>{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      />
    </div>
  );
}
