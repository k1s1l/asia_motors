"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import type { TreeNode } from "@/lib/tree";
import { categoryHref } from "@/lib/routes";
import { telHref } from "@/lib/format";

interface Props {
  tree: TreeNode[];
  links: { href: string; label: string }[];
  phones: string[];
  hours: string[];
}

export function MobileMenu({ tree, links, phones, hours }: Props) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<TreeNode[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setStack([]);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const level = stack.length ? stack[stack.length - 1].children : tree;
  const parent = stack[stack.length - 1];

  return (
    <>
      <button type="button" className="icon-btn header__burger" aria-label="Відкрити меню" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon name="menu" size={24} />
      </button>
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} />
          <nav className="drawer" aria-label="Мобільне меню">
            <div className="drawer__head">
              <strong>Меню</strong>
              <button type="button" className="icon-btn" aria-label="Закрити меню" onClick={() => setOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="drawer__body">
              <p className="drawer__label">Каталог</p>
              {parent ? (
                <>
                  <button type="button" className="drawer__link" onClick={() => setStack((s) => s.slice(0, -1))}>
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Icon name="chevronLeft" size={18} /> Назад
                    </span>
                  </button>
                  <Link href={categoryHref(parent.slug)} className="drawer__link" style={{ color: "var(--brand)" }}>
                    Усі товари: {parent.name}
                  </Link>
                </>
              ) : (
                <Link href="/catalog" className="drawer__link">Весь каталог</Link>
              )}
              {level.map((node) =>
                node.children.length ? (
                  <button key={node.id} type="button" className="drawer__link" onClick={() => setStack((s) => [...s, node])}>
                    {node.name} <Icon name="chevronRight" size={18} />
                  </button>
                ) : (
                  <Link key={node.id} href={categoryHref(node.slug)} className="drawer__link">
                    {node.name}
                  </Link>
                ),
              )}
              {links.length > 0 && (
                <>
                  <p className="drawer__label">Покупцям</p>
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="drawer__link">{l.label}</Link>
                  ))}
                </>
              )}
              {(phones.length > 0 || hours.length > 0) && (
                <>
                  <p className="drawer__label">Зв’язатися</p>
                  <div className="drawer__contacts">
                    {phones.map((p) => (
                      <a key={p} href={telHref(p)}><Icon name="phone" size={18} />{p}</a>
                    ))}
                    {hours.map((h) => (
                      <span key={h}><Icon name="clock" size={18} />{h}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
