import Link from "next/link";
import type { Metadata } from "next";
import { getMenuTree } from "@/lib/tree";
import { getCatalogMeta } from "@/lib/catalog";
import { categoryHref } from "@/lib/routes";
import { productsWord } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

export const revalidate = 300;
export const metadata: Metadata = { title: "Каталог автозапчастин", alternates: { canonical: "/catalog" } };

export default function CatalogPage() {
  const tree = getMenuTree(3);
  const meta = getCatalogMeta();
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Каталог" }]} />
      <h1 className="page__title">
        Каталог автозапчастин {meta.productCount > 0 && <small>{productsWord(meta.productCount)}</small>}
      </h1>
      {tree.length === 0 ? (
        meta.productCount > 0 ? (
          <EmptyState title="Категорії не задані" text="Товари імпортовано без структури категорій.">
            <Link href="/search" className="btn btn--primary">Усі товари</Link>
          </EmptyState>
        ) : (
          <EmptyState title="Каталог ще не наповнено" text="Товари з’являться тут після імпорту каталогу Asia Motors." />
        )
      ) : (
        <>
          <div className="contacts" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {tree.map((root) => (
              <section key={root.id} className="panel contact-card" style={{ alignContent: "start" }}>
                <Link href={categoryHref(root.slug)} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="contact-card__icon"><Icon name="box" /></span>
                  <span>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 16 }}>{root.name}</span>
                    <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>{productsWord(root.count)}</span>
                  </span>
                </Link>
                {root.children.length > 0 && (
                  <ul className="side-cats" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                    {root.children.slice(0, 8).map((c) => (
                      <li key={c.id}>
                        <Link href={categoryHref(c.slug)} style={{ fontWeight: 500 }}>
                          {c.name} <span>{c.count}</span>
                        </Link>
                      </li>
                    ))}
                    {root.children.length > 8 && (
                      <li><Link href={categoryHref(root.slug)} style={{ color: "var(--brand)", fontWeight: 700 }}>Ще {root.children.length - 8} →</Link></li>
                    )}
                  </ul>
                )}
              </section>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            <Link href="/search" className="section__link">Переглянути всі товари з фільтрами <Icon name="arrowRight" size={16} /></Link>
          </p>
        </>
      )}
    </div>
  );
}
