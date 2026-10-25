"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { TreeNode } from "@/lib/tree";
import { categoryHref } from "@/lib/routes";

export function CatalogMenu({ tree }: { tree: TreeNode[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const current = tree[active];

  return (
    <div ref={ref}>
      <button
        type="button"
        className="btn btn--primary catalog-btn"
        aria-expanded={open}
        aria-controls="megamenu"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "grid"} />
        Каталог
      </button>
      {open && (
        <div className="megamenu" id="megamenu">
          <div className="container megamenu__inner">
            {tree.length === 0 ? (
              <div className="megamenu__panel megamenu__empty">
                Категорії з’являться після імпорту каталогу. <Link href="/catalog" className="section__link">Відкрити каталог</Link>
              </div>
            ) : (
              <>
                <ul className="megamenu__roots">
                  {tree.map((node, i) => (
                    <li key={node.id}>
                      <Link
                        href={categoryHref(node.slug)}
                        className="megamenu__root"
                        data-active={i === active}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                      >
                        {node.name}
                        {node.children.length > 0 && <Icon name="chevronRight" size={16} />}
                      </Link>
                    </li>
                  ))}
                </ul>
                {current && (
                  <div className="megamenu__panel">
                    <p className="megamenu__title">
                      <Link href={categoryHref(current.slug)}>{current.name}</Link>
                      <Link href={categoryHref(current.slug)} className="section__link" style={{ fontSize: 14 }}>
                        Усі товари ({current.count}) <Icon name="arrowRight" size={16} />
                      </Link>
                    </p>
                    {current.children.length > 0 ? (
                      <div className="megamenu__cols">
                        {current.children.map((group) => (
                          <div className="megamenu__group" key={group.id}>
                            <Link href={categoryHref(group.slug)}>{group.name}</Link>
                            {group.children.length > 0 && (
                              <ul>
                                {group.children.map((leaf) => (
                                  <li key={leaf.id}>
                                    <Link href={categoryHref(leaf.slug)}>{leaf.name}</Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="megamenu__empty">У цій категорії немає підкатегорій.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
