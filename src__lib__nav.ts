import "server-only";
import { getStore } from "./store";
import { infoHref } from "./routes";

/** Посилання «Покупцям»: лише сторінки, текст яких перенесено з оригінального сайту, плюс контакти. */
export function getInfoLinks() {
  const store = getStore();
  const links = store.pages.map((p) => ({ href: infoHref(p.slug), label: p.title }));
  links.push({ href: "/contacts", label: "Контакти" });
  return links;
}
