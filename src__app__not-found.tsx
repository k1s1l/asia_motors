import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState icon="search" title="Сторінку не знайдено" text="Можливо, товар знято з продажу або посилання застаріло. Скористайтеся пошуком чи каталогом.">
        <Link href="/catalog" className="btn btn--primary">До каталогу</Link>
        <Link href="/" className="btn btn--ghost">На головну</Link>
      </EmptyState>
    </div>
  );
}
