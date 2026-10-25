export type Params = Record<string, string | string[] | undefined>;

/** Будує URL зі зміненими параметрами; при зміні фільтрів сторінка скидається на першу. */
export function withParams(base: string, current: Params, changes: Params, keepPage = false) {
  const sp = new URLSearchParams();
  const merged: Params = { ...current, ...changes };
  if (!keepPage && !("page" in changes)) delete merged.page;
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined) continue;
    for (const item of Array.isArray(v) ? v : [v]) if (item !== "") sp.append(k, item);
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

export function toggleValue(current: Params, key: string, value: string): string[] {
  const raw = current[key];
  const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}
