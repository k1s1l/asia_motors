export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export interface ProductParam {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  sku?: string;
  brand?: string;
  /** Ціна в гривнях; null — ціну в джерелі не вказано */
  price: number | null;
  oldPrice?: number;
  currency: string;
  /** null — наявність у джерелі не вказана */
  available: boolean | null;
  stockText?: string;
  images: string[];
  /** Санітизований HTML опису з джерела */
  descriptionHtml?: string;
  params: ProductParam[];
  /** Застосовність до автомобілів, як вказано в джерелі */
  compatibility: string[];
  /** Марки авто, витягнуті з полів сумісності */
  carMakes: string[];
  sourceUrl?: string;
}

export interface Catalog {
  meta: { source: string | null; importedAt: string | null };
  categories: Category[];
  products: Product[];
}

export interface StorePage {
  slug: string;
  title: string;
  /** Абзаци тексту з оригінального сайту */
  body: string[];
}

export interface StoreInfo {
  name: string;
  description: string;
  phones: string[];
  emails: string[];
  addresses: string[];
  hours: string[];
  socials: { label: string; url: string }[];
  deliveryMethods: string[];
  paymentMethods: string[];
  pages: StorePage[];
  logo?: string;
}
