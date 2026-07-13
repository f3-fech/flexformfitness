import { db } from './firebase';

export interface MegaMenuSection {
  title: string;
  titleEn?: string;
  collectionIds: string[];
}

export interface MegaMenuPromoImage {
  imageUrl: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  linkUrl?: string;
}

export interface MegaMenuConfig {
  section1: MegaMenuSection;
  section2: MegaMenuSection;
  promo1: MegaMenuPromoImage;
  promo2: MegaMenuPromoImage;
}

export interface GeneralSettings {
  shippingPrice: number;       // in cents (e.g. 499 for $4.99)
  freeShippingMin: number;     // in cents (e.g. 5000 for $50.00)
  markets: string[];           // country codes, e.g. ['US', 'CA', 'ES', 'MX']
  admins: string[];            // admin email list
  logoUrl?: string;
  faviconUrl?: string;
  heroVideoUrl?: string;
  megaMenu?: MegaMenuConfig;
}

export const defaultSettings: GeneralSettings = {
  shippingPrice: 499,
  freeShippingMin: 5000,
  markets: ['US', 'CA', 'ES', 'MX'],
  admins: [],
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  heroVideoUrl: 'https://firebasestorage.googleapis.com/v0/b/flexformfitness-673f4.firebasestorage.app/o/assets%2Fhero.mp4?alt=media&token=d2387591-833c-42d9-8342-45f30551a908',
};

// In-memory cache for settings
let cachedSettings: GeneralSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getGeneralSettings(forceRefresh = false): Promise<GeneralSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedSettings;
  }

  try {
    const doc = await db.collection('settings').doc('general').get();
    if (doc.exists) {
      const data = doc.data() as Partial<GeneralSettings>;
      cachedSettings = {
        shippingPrice: data.shippingPrice !== undefined ? data.shippingPrice : defaultSettings.shippingPrice,
        freeShippingMin: data.freeShippingMin !== undefined ? data.freeShippingMin : defaultSettings.freeShippingMin,
        markets: data.markets || defaultSettings.markets,
        admins: data.admins || defaultSettings.admins,
        logoUrl: data.logoUrl || defaultSettings.logoUrl,
        faviconUrl: data.faviconUrl || defaultSettings.faviconUrl,
        heroVideoUrl: data.heroVideoUrl || defaultSettings.heroVideoUrl,
        megaMenu: data.megaMenu,
      };
      cacheTimestamp = now;
      return cachedSettings;
    }
  } catch (error) {
    console.error('Error fetching general settings from Firestore:', error);
  }
  return defaultSettings;
}

export function clearSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}
