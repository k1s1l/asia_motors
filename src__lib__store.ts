import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { StoreInfo } from "./types";

const STORE_PATH = path.resolve(process.cwd(), process.env.STORE_PATH || "data/store.json");

const EMPTY: StoreInfo = {
  name: "Asia Motors",
  description: "",
  phones: [],
  emails: [],
  addresses: [],
  hours: [],
  socials: [],
  deliveryMethods: [],
  paymentMethods: [],
  pages: [],
};

let cache: { mtime: number; data: StoreInfo } | null = null;

export function getStore(): StoreInfo {
  let mtime = 0;
  try {
    mtime = fs.statSync(STORE_PATH).mtimeMs;
  } catch {}
  if (cache && cache.mtime === mtime) return cache.data;
  let data = EMPTY;
  if (mtime) {
    try {
      data = { ...EMPTY, ...JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) };
    } catch (err) {
      console.error(`[store] Не вдалося прочитати ${STORE_PATH}:`, err);
    }
  }
  cache = { mtime, data };
  return data;
}

export function getStorePage(slug: string) {
  return getStore().pages.find((p) => p.slug === slug);
}

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
