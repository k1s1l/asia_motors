"use client";
import { useState } from "react";
import { Icon } from "./Icon";

export function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      title="Скопіювати"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // буфер обміну недоступний — значення все одно видно на екрані
        }
      }}
    >
      {text}
      <Icon name={done ? "check" : "copy"} size={14} aria-hidden />
      <span className="sr-only">{done ? "Скопійовано" : "Скопіювати артикул"}</span>
    </button>
  );
}
