import type { Product, ProductVariant } from '../types';

export interface ParsedApparelAttributes {
  gender: 'male' | 'female' | 'unisex';
  ageGroup: 'adult' | 'kids' | 'toddler' | 'infant' | 'newborn';
  color: string;
  size: string;
  category: string;
  productType: string;
  availability: 'in_stock' | 'out_of_stock';
  schemaAvailability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
}

const KNOWN_SIZES = new Set(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', 'ONE SIZE', 'UNICA']);

export function formatColor(raw: string | undefined): string {
  if (!raw) return 'Multicolor';
  const clean = raw.replace(/[-_]/g, ' ').trim();
  if (!clean) return 'Multicolor';
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSize(raw: string | undefined): string {
  if (!raw) return 'M';
  const clean = raw.trim().toUpperCase();
  return clean || 'M';
}

export function isKnownSize(str: string): boolean {
  return KNOWN_SIZES.has(str.trim().toUpperCase());
}

export function detectGender(productTitle: string, productDescription?: string): 'male' | 'female' | 'unisex' {
  const combined = `${productTitle} ${productDescription || ''}`.toLowerCase();
  if (/\b(hombre|man|men|male|caballero)\b/i.test(combined)) {
    return 'male';
  }
  if (/\b(mujer|woman|women|female|dama|chica)\b/i.test(combined)) {
    return 'female';
  }
  return 'unisex';
}

export function parseVariantName(variantName: string | undefined, fallbackTitle: string): { color: string; size: string } {
  if (!variantName || !variantName.trim()) {
    return { color: 'Multicolor', size: 'M' };
  }

  const slashParts = variantName.split('/').map((s) => s.trim());
  if (slashParts.length >= 2) {
    return {
      color: formatColor(slashParts[0]),
      size: formatSize(slashParts[1]),
    };
  }

  const dashParts = variantName.split('-').map((s) => s.trim());
  if (dashParts.length >= 2 && isKnownSize(dashParts[dashParts.length - 1])) {
    const size = formatSize(dashParts.pop()!);
    const color = formatColor(dashParts.join(' '));
    return { color, size };
  }

  const single = variantName.trim();
  if (isKnownSize(single)) {
    return { color: 'Multicolor', size: formatSize(single) };
  }

  return { color: formatColor(single), size: 'M' };
}

/**
 * Ensures Google Merchant Center item ID does not exceed the strict 50-character limit.
 */
export function formatMerchantId(rawId: string | null | undefined): string {
  if (!rawId) return 'item';
  const clean = rawId.trim();
  if (clean.length <= 50) return clean;

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  const prefix = clean.substring(0, 41).replace(/-$/, '');
  const result = `${prefix}-${hashHex}`;
  return result.length > 50 ? result.substring(0, 50) : result;
}

export function getApparelAttributes(
  product: Product,
  variant?: ProductVariant | null,
  isEn: boolean = false
): ParsedApparelAttributes {
  const title = isEn ? (product.title_en || product.title) : product.title;
  const desc = isEn ? (product.description_en || product.description) : product.description;
  
  const gender = detectGender(title, desc);
  const ageGroup = 'adult';
  const { color, size } = parseVariantName(variant?.name, title);

  const stock = variant ? (variant.stock ?? 0) : (product.stock ?? 0);
  const availability: 'in_stock' | 'out_of_stock' = stock > 0 ? 'in_stock' : 'out_of_stock';
  const schemaAvailability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  let productType = isEn ? 'Sportswear > Fitness & Bodybuilding' : 'Ropa Deportiva > Fitness y Culturismo';
  if (gender === 'male') {
    productType = isEn ? 'Men\'s Sportswear > Fitness Clothing' : 'Ropa Deportiva Hombre > Ropa Gym y Fitness';
  } else if (gender === 'female') {
    productType = isEn ? 'Women\'s Sportswear > Activewear & Fitness' : 'Ropa Deportiva Mujer > Ropa Gym y Tops';
  }

  return {
    gender,
    ageGroup,
    color,
    size,
    category: 'Apparel & Accessories > Clothing',
    productType,
    availability,
    schemaAvailability,
  };
}
