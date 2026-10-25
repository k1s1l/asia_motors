import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/search", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
