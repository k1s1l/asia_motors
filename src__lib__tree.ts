import "server-only";
import { countProductsInCategory, getChildCategories, getRootCategories } from "./catalog";

export interface TreeNode {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: TreeNode[];
}

function build(id: string, depth: number): TreeNode[] {
  if (depth <= 0) return [];
  return getChildCategories(id)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: countProductsInCategory(c.id), children: build(c.id, depth - 1) }))
    .filter((n) => n.count > 0);
}

/** Дерево для меню: лише категорії, в яких є товари. */
export function getMenuTree(depth = 3): TreeNode[] {
  return getRootCategories()
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: countProductsInCategory(c.id), children: build(c.id, depth - 1) }))
    .filter((n) => n.count > 0);
}
