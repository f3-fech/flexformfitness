export interface ProductVariant {
  sku: string;
  name: string;
  price: number; // in cents
  stock: number;
  image?: string | null;
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface Product {
  id: string; // Firestore document ID
  title: string;
  slug: string; // URL slug
  description: string;
  price: number; // base price in cents
  images: string[];
  stock: number; // overall stock (or base item stock)
  variants: ProductVariant[];
  seo: ProductSEO;
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
  paymentStatus: 'pending' | 'paid' | 'failed';
  shippingStatus: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber: string | null;
  createdAt: any; // admin.firestore.Timestamp or Date
}

export interface ProductCollection {
  id: string;
  title: string;
  slug: string;
  description: string;
  productIds: string[];
  seo: ProductSEO;
  createdAt: any;
  updatedAt: any;
}
