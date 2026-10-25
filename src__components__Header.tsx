import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { SearchBox } from "./SearchBox";
import { CatalogMenu } from "./CatalogMenu";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";
import { getStore } from "@/lib/store";
import { getMenuTree } from "@/lib/tree";
import { getInfoLinks } from "@/lib/nav";
import { categoryHref } from "@/lib/routes";
import { telHref } from "@/lib/format";

export function Header() {
  const store = getStore();
  const tree = getMenuTree();
  const links = getInfoLinks();
  const phone = store.phones[0];

  return (
    <>
      <a href="#main" className="skip-link">Перейти до вмісту</a>
      <div className="topbar">
        <div className="container topbar__inner">
          <nav className="topbar__links" aria-label="Інформація для покупців">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
          <div className="topbar__contacts">
            {store.hours[0] && <span><Icon name="clock" size={15} />{store.hours[0]}</span>}
            {store.emails[0] && <a href={`mailto:${store.emails[0]}`}><Icon name="mail" size={15} />{store.emails[0]}</a>}
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container header__main">
          <MobileMenu tree={tree} links={links} phones={store.phones} hours={store.hours} />
          <Logo name={store.name} src={store.logo} />
          <CatalogMenu tree={tree} />
          <Suspense fallback={<div className="search header__search"><div className="search__form" /></div>}>
            <SearchBox className="header__search" />
          </Suspense>
          {phone && (
            <div className="header__phone">
              <a href={telHref(phone)}>{phone}</a>
              {store.phones.length > 1 ? <span>{store.phones.slice(1, 2).join(", ")}</span> : store.hours[0] && <span>{store.hours[0]}</span>}
            </div>
          )}
          <div className="header__actions">
            <CartButton />
          </div>
        </div>
        {tree.length > 0 && (
          <nav className="navbar" aria-label="Основні категорії">
            <div className="container">
              <ul className="navbar__list">
                {tree.slice(0, 8).map((n) => (
                  <li key={n.id}><Link href={categoryHref(n.slug)}>{n.name}</Link></li>
                ))}
                {tree.length > 8 && <li><Link href="/catalog">Усі категорії</Link></li>}
              </ul>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
