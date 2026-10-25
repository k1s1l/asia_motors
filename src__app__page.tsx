import Link from "next/link";
import { Suspense } from "react";
import { getAllProducts, getCarMakes, getCatalogMeta } from "@/lib/catalog";
import { getMenuTree } from "@/lib/tree";
import { getStore, SITE_URL } from "@/lib/store";
import { categoryHref } from "@/lib/routes";
import { productsWord } from "@/lib/format";
import { SearchBox } from "@/components/SearchBox";
import { ProductGrid } from "@/components/ProductCard";
import { Icon } from "@/components/Icon";

export const revalidate = 300;

export default function HomePage() {
  const store = getStore();
  const meta = getCatalogMeta();
  const tree = getMenuTree(1);
  const makes = getCarMakes();
  const products = getAllProducts();
  const sale = products.filter((p) => p.price !== null && p.oldPrice && p.oldPrice > p.price && p.available !== false).slice(0, 10);
  const inStock = products.filter((p) => p.available === true && p.price !== null);
  const showcase = (inStock.length ? inStock : products).slice(0, 10);
  const inStockCount = products.filter((p) => p.available === true).length;

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: store.name,
    url: SITE_URL,
    ...(store.phones[0] ? { telephone: store.phones[0] } : {}),
    ...(store.emails[0] ? { email: store.emails[0] } : {}),
    ...(store.addresses[0] ? { address: store.addresses[0] } : {}),
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={q}`, "query-input": "required name=q" },
  };

  return (
    <div className="container">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <p className="hero__eyebrow">Інтернет-магазин {store.name}</p>
          <h1 className="hero__title" id="hero-title">Автозапчастини для азійських автомобілів</h1>
          {store.description && <p className="hero__text">{store.description}</p>}
          <div className="hero__search">
            <Suspense>
              <SearchBox large />
            </Suspense>
          </div>
          {meta.productCount > 0 && (
            <div className="hero__stats">
              <div className="hero__stat"><b>{meta.productCount.toLocaleString("uk-UA")}</b><span>товарів у каталозі</span></div>
              {inStockCount > 0 && <div className="hero__stat"><b>{inStockCount.toLocaleString("uk-UA")}</b><span>в наявності</span></div>}
              {makes.length > 0 && <div className="hero__stat"><b>{makes.length}</b><span>марок авто</span></div>}
            </div>
          )}
        </div>
      </section>

      {meta.productCount === 0 && (
        <section className="section panel setup" aria-labelledby="setup-title">
          <h2 id="setup-title">Каталог ще не імпортовано</h2>
          <p>Дизайн і функціонал магазину готові, але дані оригінального сайту Asia Motors ще не завантажені — сервер розробки не мав доступу до asia-motors.in.ua. Щоб наповнити магазин реальними товарами:</p>
          <ol>
            <li>Експортуйте каталог з адмін-панелі (YML/XML-фід або CSV).</li>
            <li>Виконайте <code>npm run import:catalog -- шлях/до/файлу</code>.</li>
            <li>Заповніть контакти, умови доставки й оплати в <code>data/store.json</code>.</li>
          </ol>
        </section>
      )}

      {tree.length > 0 && (
        <section className="section" aria-labelledby="cats-title">
          <div className="section__head">
            <h2 className="section__title" id="cats-title">Категорії запчастин</h2>
            <Link href="/catalog" className="section__link">Весь каталог <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="cat-grid">
            {tree.map((c) => (
              <Link key={c.id} href={categoryHref(c.slug)} className="cat-tile">
                <span className="cat-tile__icon"><Icon name="box" size={22} /></span>
                <span className="cat-tile__name">{c.name}</span>
                <span className="cat-tile__count">{productsWord(c.count)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {makes.length > 0 && (
        <section className="section" aria-labelledby="makes-title">
          <div className="section__head">
            <h2 className="section__title" id="makes-title">Підбір за маркою авто</h2>
          </div>
          <div className="makes">
            {makes.map((m) => (
              <Link key={m.name} href={`/search?make=${encodeURIComponent(m.name)}`} className="make-chip">
                <Icon name="car" size={18} /> {m.name} <span>{m.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sale.length > 0 && (
        <section className="section" aria-labelledby="sale-title">
          <div className="section__head">
            <h2 className="section__title" id="sale-title">Товари зі знижкою</h2>
          </div>
          <ProductGrid products={sale} />
        </section>
      )}

      {showcase.length > 0 && (
        <section className="section" aria-labelledby="stock-title">
          <div className="section__head">
            <h2 className="section__title" id="stock-title">{inStock.length ? "В наявності" : "Товари каталогу"}</h2>
            <Link href={inStock.length ? "/search?stock=1" : "/search"} className="section__link">Дивитися всі <Icon name="arrowRight" size={16} /></Link>
          </div>
          <ProductGrid products={showcase} />
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
