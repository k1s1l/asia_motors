"use client";
import { EmptyState } from "@/components/EmptyState";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container page">
      <EmptyState icon="alert" title="Щось пішло не так" text="Не вдалося завантажити сторінку. Спробуйте ще раз.">
        <button type="button" className="btn btn--primary" onClick={reset}>Спробувати ще раз</button>
      </EmptyState>
    </div>
  );
}
