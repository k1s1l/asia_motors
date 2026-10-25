import Link from "next/link";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { getStore } from "@/lib/store";
import { getMenuTree } from "@/lib/tree";
import { getInfoLinks } from "@/lib/nav";
import { categoryHref } from "@/lib/routes";
import { telHref } from "@/lib/format";

export function Footer() {
  const store = getStore();
  const tree = getMenuTree(1);
  const links = getInfoLinks();
  const hasContacts = store.phones.length + store.emails.length + store.addresses.length + store.hours.length > 0;

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo name={store.name} src={store.logo} />
          {store.description && <p className="footer__about">{store.description}</p>}
          {store.socials.length > 0 && (
            <ul style={{ marginTop: 16 }}>
              {store.socials.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2>Каталог</h2>
          <ul>
            {tree.slice(0, 8).map((n) => (
              <li key={n.id}><Link href={categoryHref(n.slug)}>{n.name}</Link></li>
            ))}
            <li><Link href="/catalog">Усі категорії</Link></li>
          </ul>
        </div>
        <div>
          <h2>Покупцям</h2>
          <ul>
            {links.map((l) => (
              <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
            ))}
            <li><Link href="/cart">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <h2>Контакти</h2>
          {hasContacts ? (
            <ul>
              {store.phones.map((p) => (
                <li key={p} className="footer__contact"><Icon name="phone" size={16} /><a href={telHref(p)}>{p}</a></li>
              ))}
              {store.emails.map((e) => (
                <li key={e} className="footer__contact"><Icon name="mail" size={16} /><a href={`mailto:${e}`}>{e}</a></li>
              ))}
              {store.addresses.map((a) => (
                <li key={a} className="footer__contact"><Icon name="pin" size={16} /><span>{a}</span></li>
              ))}
              {store.hours.map((h) => (
                <li key={h} className="footer__contact"><Icon name="clock" size={16} /><span>{h}</span></li>
              ))}
            </ul>
          ) : (
            <p>Контактні дані ще не перенесені з оригінального сайту.</p>
          )}
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} {store.name}</span>
      </div>
    </footer>
  );
}
