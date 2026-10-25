import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { telHref } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { Icon, type IconName } from "@/components/Icon";
import { InfoNav } from "@/components/InfoNav";

export const revalidate = 300;
export const metadata: Metadata = { title: "Контакти", alternates: { canonical: "/contacts" } };

export default function ContactsPage() {
  const s = getStore();
  const all: { icon: IconName; title: string; items: { text: string; href?: string }[] }[] = [
    { icon: "phone", title: "Телефони", items: s.phones.map((p) => ({ text: p, href: telHref(p) })) },
    { icon: "mail", title: "E-mail", items: s.emails.map((e) => ({ text: e, href: `mailto:${e}` })) },
    { icon: "pin", title: "Адреса", items: s.addresses.map((a) => ({ text: a })) },
    { icon: "clock", title: "Графік роботи", items: s.hours.map((h) => ({ text: h })) },
    { icon: "info", title: "Ми в мережі", items: s.socials.map((x) => ({ text: x.label, href: x.url })) },
  ];
  const cards = all.filter((c) => c.items.length > 0);

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Контакти" }]} />
      <h1 className="page__title">Контакти</h1>
      <div className="info-layout">
        <InfoNav current="contacts" />
        {cards.length ? (
          <div className="contacts">
            {cards.map((c) => (
              <section key={c.title} className="contact-card panel">
                <span className="contact-card__icon"><Icon name={c.icon} /></span>
                <h2>{c.title}</h2>
                {c.items.map((it) =>
                  it.href ? (
                    <a key={it.text} href={it.href} {...(it.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{it.text}</a>
                  ) : (
                    <p key={it.text}>{it.text}</p>
                  ),
                )}
              </section>
            ))}
          </div>
        ) : (
          <EmptyState icon="phone" title="Контакти ще не додані" text="Контактні дані Asia Motors не вдалося отримати з оригінального сайту. Їх потрібно внести в data/store.json." />
        )}
      </div>
    </div>
  );
}
