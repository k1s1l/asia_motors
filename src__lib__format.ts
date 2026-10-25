const uah = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 });

export function formatPrice(value: number, currency = "UAH") {
  const sign = currency === "UAH" ? "₴" : currency;
  return `${uah.format(value)} ${sign}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function pluralUk(n: number, forms: [string, string, string]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

export const productsWord = (n: number) => `${n} ${pluralUk(n, ["товар", "товари", "товарів"])}`;
