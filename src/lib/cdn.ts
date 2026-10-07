/**
 * Convierte URLs de Firebase Storage al CDN proxy de Cloudflare Worker
 * para reducir costos de egress y mejorar velocidad de carga mediante caché.
 */
export const CDN_DOMAIN = 'cdn-storage.spring-band-85d5.workers.dev';
export const FIREBASE_STORAGE_DOMAIN = 'firebasestorage.googleapis.com';

export function optimizeStorageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes(FIREBASE_STORAGE_DOMAIN)) return url;
  return url.replace(FIREBASE_STORAGE_DOMAIN, CDN_DOMAIN);
}

/**
 * Optimiza un arreglo de URLs
 */
export function optimizeStorageUrls(urls: (string | null | undefined)[]): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map(optimizeStorageUrl).filter(Boolean);
}

/**
 * Optimiza un producto completo sustituyendo todas las URLs de Firebase Storage
 * (imágenes principales, variantes, tallas) por las del CDN proxy.
 */
export function optimizeProduct<T extends { images?: string[]; variants?: any[] }>(product: T): T {
  if (!product) return product;
  return {
    ...product,
    images: Array.isArray(product.images) ? optimizeStorageUrls(product.images) : product.images,
    variants: Array.isArray(product.variants)
      ? product.variants.map((v) => ({
          ...v,
          image: v.image ? optimizeStorageUrl(v.image) : v.image,
        }))
      : product.variants,
  };
}

/**
 * Optimiza una lista de productos
 */
export function optimizeProducts<T extends { images?: string[]; variants?: any[] }>(products: T[]): T[] {
  if (!Array.isArray(products)) return [];
  return products.map(optimizeProduct);
}

