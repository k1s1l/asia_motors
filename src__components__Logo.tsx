import Link from "next/link";

/**
 * Текстовий знак Asia Motors. Коли буде наданий оригінальний файл логотипа,
 * вкажіть шлях до нього в data/store.json → "logo" (наприклад, "/logo.svg").
 */
export function Logo({ name, src }: { name: string; src?: string }) {
  const [first, ...rest] = name.split(" ");
  return (
    <Link href="/" className="logo" aria-label={`${name} — на головну`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} />
      ) : (
        <>
          <span className="logo__mark" aria-hidden="true">
            {name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <span className="logo__text">
            <span className="logo__name">
              {first} {rest.length > 0 && <b>{rest.join(" ")}</b>}
            </span>
            <span className="logo__sub">Автозапчастини</span>
          </span>
        </>
      )}
    </Link>
  );
}
