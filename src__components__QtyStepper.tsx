"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { MAX_QTY } from "@/lib/order";

export function QtyStepper({ value, onChange, label, small = false }: { value: number; onChange: (n: number) => void; label: string; small?: boolean }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Math.floor(Number(draft));
    if (Number.isFinite(n) && n >= 1) onChange(Math.min(MAX_QTY, n));
    else setDraft(String(value));
  };
  return (
    <div className={`qty${small ? " qty--sm" : ""}`}>
      <button type="button" aria-label="Зменшити кількість" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY}
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      <button type="button" aria-label="Збільшити кількість" disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
