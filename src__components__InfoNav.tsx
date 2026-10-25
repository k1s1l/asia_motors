import Link from "next/link";
import { getStore } from "@/lib/store";
import { infoHref } from "@/lib/routes";

export function InfoNav({ current }: { current: string }) {
  const store = getStore();
  return (
    <nav className="info-nav panel" aria-label="Інформація для покупців">
      {store.pages.map((p) => (
        <Link key={p.slug} href={infoHref(p.slug)} aria-current={p.slug === current ? "page" : undefined}>{p.title}</Link>
      ))}
      <Link href="/contacts" aria-current={current === "contacts" ? "page" : undefined}>Контакти</Link>
    </nav>
  );
}
