import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToastHost } from "@/components/Toast";
import { SITE_URL, getStore } from "@/lib/store";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap" });

export function generateMetadata(): Metadata {
  const store = getStore();
  const description = store.description || `${store.name} — інтернет-магазин автозапчастин для азійських автомобілів.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${store.name} — автозапчастини`, template: `%s | ${store.name}` },
    description,
    openGraph: { type: "website", locale: "uk_UA", siteName: store.name, description },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#1b1f26", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={manrope.variable}>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <ToastHost />
      </body>
    </html>
  );
}
