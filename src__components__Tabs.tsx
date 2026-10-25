"use client";
import { useId, useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { id: string; label: string; count?: number; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const uid = useId();
  if (!tabs.length) return null;
  return (
    <section className="tabs panel">
      <div className="tabs__list" role="tablist">
        {tabs.map((t, idx) => (
          <button
            key={t.id}
            id={`${uid}-tab-${t.id}`}
            role="tab"
            type="button"
            className="tabs__tab"
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => {
              const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!d) return;
              const next = tabs[(idx + d + tabs.length) % tabs.length];
              setActive(next.id);
              document.getElementById(`${uid}-tab-${next.id}`)?.focus();
            }}
          >
            {t.label}
            {t.count !== undefined && <span>{t.count}</span>}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${uid}-panel-${t.id}`} role="tabpanel" aria-labelledby={`${uid}-tab-${t.id}`} className="tabs__panel" hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </section>
  );
}
