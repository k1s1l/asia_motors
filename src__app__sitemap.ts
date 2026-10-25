import type { MetadataRoute } from "next";
import { getAllCategories, getAllProducts, getCatalogMeta } from "@/lib/catalog";
import { getStore, SITE_URL } from "@/lib/store";
import { categoryHref, infoHref, productHref } from "@/lib/routes";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = getCatalogMeta().importedAt ?? undefined;
  return [
    { url: SITE_URL + "/", lastModified },
    { url: SITE_URL + "/catalog", lastModified },
    { url: SITE_URL + "/contacts" },
    ...getStore().pages.map((p) => ({ url: SITE_URL + infoHref(p.slug) })),
    ...getAllCategories().map((c) => ({ url: SITE_URL + categoryHref(c.slug), lastModified })),
    ...getAllProducts().map((p) => ({ url: SITE_URL + productHref(p.slug), lastModified })),
  ];
}
