"use client";
import { useState } from "react";
import { Icon } from "./Icon";

/** Фото з джерела; якщо його немає або воно не завантажилось — нейтральна заглушка. */
export function ProductImage({ src, alt, eager = false }: { src?: string; alt: string; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span style={{ display: "grid", placeItems: "center", gap: 6, color: "var(--line-2)", width: "100%", height: "100%" }} role="img" aria-label={`${alt}: фото відсутнє`}>
        <Icon name="image" size={48} strokeWidth={1.2} />
      </span>
    );
  }
  return (
    // Зображення приходять з довільного домену джерела, тому використовується звичайний <img> з lazy-завантаженням.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
