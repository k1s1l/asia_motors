"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type ToastMsg = { id: number; text: string; withCartLink?: boolean };
let push: ((m: Omit<ToastMsg, "id">) => void) | null = null;

export function toast(text: string, withCartLink = false) {
  push?.({ text, withCartLink });
}

export function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  useEffect(() => {
    push = (m) => setMsg({ ...m, id: Date.now() });
    return () => {
      push = null;
    };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div aria-live="polite" role="status">
      {msg && (
        <div className="toast" key={msg.id}>
          <Icon name="check" />
          <span>{msg.text}</span>
          {msg.withCartLink && <Link href="/cart">Перейти в кошик</Link>}
        </div>
      )}
    </div>
  );
}
