export interface ProductVariant {
  sku: string;
  name: string;
  price: number; // in cents
  stock: number;
  image?: string | null;
  colorHex?: string | null;
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface Product {
  id: string; // Firestore document ID
  title: string;
  title_en?: string;
  slug: string; // URL slug
  description: string;
  description_en?: string;
  category?: string;
  category_en?: string;
  gender?: 'hombre' | 'mujer';
  price: number; // base price in cents
  images: string[];
  stock: number; // overall stock (or base item stock)
  variants: ProductVariant[];
  sizeChartImage?: string | null;
  sizeMeasurements?: Record<string, Record<string, string>> | null; // e.g. { length: { S: "68", M: "70" }, chest: { S: "48", M: "50" } } in cm
  specs?: {
    material?: string;
    fabricWeight?: string;
    fit?: string;
  } | null;
  seo: ProductSEO;
  seo_en?: ProductSEO;
  createdAt: any; // admin.firestore.Timestamp or Date
  updatedAt: any; // admin.firestore.Timestamp or Date
}

export interface Address {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string | null;
  address: Address;
}

export interface OrderItem {
  productId: string;
  variantSku?: string | null;
  title: string;
  variantName?: string | null;
  quantity: number;
  price: number; // in cents at time of purchase
  image?: string | null;
}

export interface Order {
  id: string; // Matches the Stripe Checkout Session ID
  customerDetails: CustomerDetails;
  items: OrderItem[];
  totalAmount: number; // total amount in cents
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber: string | null;
  createdAt: any; // admin.firestore.Timestamp or Date
  deliveredAt?: string | null; // ISO timestamp when product was delivered
  returnRequest?: {
    reason: string;
    images: string[];
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
  } | null;
}

export interface ProductCollection {
  id: string;
  title: string;
  title_en?: string;
  slug: string;
  description: string;
  description_en?: string;
  detailedDescription?: string | null;
  detailedDescription_en?: string | null;
  productIds: string[];
  showOnIndex?: boolean;
  indexOrder?: number;
  isSynergy?: boolean;
  seo: ProductSEO;
  seo_en?: ProductSEO;
  parentCategory?: string | null;
  createdAt: any;
  updatedAt: any;
}
