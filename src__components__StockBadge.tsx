export function StockBadge({ available, text }: { available: boolean | null; text?: string }) {
  if (available === true) return <span className="badge badge--ok">{text || "В наявності"}</span>;
  if (available === false) return <span className="badge badge--no">{text || "Немає в наявності"}</span>;
  return text ? <span className="badge badge--unknown">{text}</span> : null;
}
