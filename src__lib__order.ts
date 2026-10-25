/** Спільна для клієнта й сервера перевірка форми замовлення. */

export interface OrderForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  delivery: string;
  payment: string;
  comment: string;
  /** VIN допомагає менеджеру перевірити сумісність запчастин */
  vin: string;
}

export interface OrderLine {
  id: string;
  qty: number;
}

export type OrderErrors = Partial<Record<keyof OrderForm, string>>;

export const MAX_QTY = 99;

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  return null;
}

export function validateOrder(
  form: OrderForm,
  options: { deliveryMethods: string[]; paymentMethods: string[] },
): OrderErrors {
  const e: OrderErrors = {};
  const name = form.name.trim();
  if (name.length < 2) e.name = "Вкажіть ім'я та прізвище";
  else if (name.length > 100) e.name = "Занадто довге ім'я";
  if (!form.phone.trim()) e.phone = "Вкажіть номер телефону";
  else if (!normalizePhone(form.phone)) e.phone = "Формат: +380 XX XXX XX XX";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = "Некоректна адреса e-mail";
  if (!form.city.trim()) e.city = "Вкажіть місто";
  if (options.deliveryMethods.length && !options.deliveryMethods.includes(form.delivery)) e.delivery = "Оберіть спосіб доставки";
  if (options.paymentMethods.length && !options.paymentMethods.includes(form.payment)) e.payment = "Оберіть спосіб оплати";
  if (form.vin.trim() && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(form.vin.trim())) e.vin = "VIN містить 17 символів (без I, O, Q)";
  if (form.comment.length > 1000) e.comment = "Не більше 1000 символів";
  return e;
}
