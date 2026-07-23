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

export interface HeroButtonConfig {
  text: string;
  textEn?: string;
  collectionId: string;
  style: 'primary' | 'secondary' | 'pink';
  enabled: boolean;
}

export interface HeroSlide {
  id: string;
  desktopType: 'image' | 'video';
  desktopUrl: string;
  mobileType: 'image' | 'video';
  mobileUrl: string;
  button1: HeroButtonConfig;
  button2: HeroButtonConfig;
  showTitleOverlay?: boolean;
}

export interface GeneralSettings {
  shippingPrice: number;       // in cents (e.g. 499 for $4.99)
  freeShippingMin: number;     // in cents (e.g. 5000 for $50.00)
  markets: string[];           // country codes, e.g. ['US', 'CA', 'ES', 'MX']
  admins: string[];            // admin email list
  logoUrl?: string;
  faviconUrl?: string;
  heroImage1Url?: string;
  heroVideoUrl?: string;
  heroImage2Url?: string;
  heroImage3Url?: string;
  heroVideo2Url?: string;
  heroSlide2Type?: 'image' | 'video';
  heroSlide3Type?: 'image' | 'video';
  heroCapsuleCollectionId?: string; // Collection to link in Hero Capsule button
  heroSlides?: HeroSlide[];
  megaMenu?: MegaMenuConfig;
  megaMenuHombre?: MegaMenuConfig;
  megaMenuMujer?: MegaMenuConfig;
}

export const defaultSettings: GeneralSettings = {
  shippingPrice: 499,
  freeShippingMin: 5000,
  markets: ['US', 'CA', 'ES', 'MX'],
  admins: [],
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  heroImage1Url: '/images/hero-slide1.png',
  heroVideoUrl: 'https://firebasestorage.googleapis.com/v0/b/flexformfitness-673f4.firebasestorage.app/o/assets%2Fhero.mp4?alt=media&token=d2387591-833c-42d9-8342-45f30551a908',
  heroImage2Url: '/images/hero-slide2.png',
  heroImage3Url: '/images/hero-slide3.png',
  heroVideo2Url: '',
  heroSlide2Type: 'video',
  heroSlide3Type: 'image',
  heroSlides: [
    {
      id: 'default-slide-1',
      desktopType: 'image',
      desktopUrl: '/images/hero-slide1.png',
      mobileType: 'image',
      mobileUrl: '/images/hero-slide1.png',
      button1: {
        text: 'Comprar ahora',
        textEn: 'Shop now',
        collectionId: '',
        style: 'secondary',
        enabled: true,
      },
      button2: {
        text: '',
        textEn: '',
        collectionId: '',
        style: 'primary',
        enabled: false,
      },
      showTitleOverlay: true
    },
    {
      id: 'default-slide-2',
      desktopType: 'video',
      desktopUrl: 'https://firebasestorage.googleapis.com/v0/b/flexformfitness-673f4.firebasestorage.app/o/assets%2Fhero.mp4?alt=media&token=d2387591-833c-42d9-8342-45f30551a908',
      mobileType: 'video',
      mobileUrl: 'https://firebasestorage.googleapis.com/v0/b/flexformfitness-673f4.firebasestorage.app/o/assets%2Fhero.mp4?alt=media&token=d2387591-833c-42d9-8342-45f30551a908',
      button1: {
        text: 'Comprar ahora',
        textEn: 'Shop now',
        collectionId: '',
        style: 'secondary',
        enabled: true,
      },
      button2: {
        text: '',
        textEn: '',
        collectionId: '',
        style: 'primary',
        enabled: false,
      },
      showTitleOverlay: true
    },
    {
      id: 'default-slide-3',
      desktopType: 'image',
      desktopUrl: '/images/hero-slide2.png',
      mobileType: 'image',
      mobileUrl: '/images/hero-slide2.png',
      button1: {
        text: 'Comprar ahora',
        textEn: 'Shop now',
        collectionId: '',
        style: 'secondary',
        enabled: true,
      },
      button2: {
        text: '',
        textEn: '',
        collectionId: '',
        style: 'primary',
        enabled: false,
      },
      showTitleOverlay: true
    }
  ]
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
      
      const defaultButton1 = (text?: string, textEn?: string, collectionId?: string): HeroButtonConfig => ({
        text: text || 'Comprar ahora',
        textEn: textEn || 'Shop now',
        collectionId: collectionId || '',
        style: 'secondary',
        enabled: true,
      });

      const defaultButton2 = (): HeroButtonConfig => ({
        text: '',
        textEn: '',
        collectionId: '',
        style: 'primary',
        enabled: false,
      });

      const legacySlides: HeroSlide[] = [
        {
          id: 'legacy-slide-1',
          desktopType: 'image',
          desktopUrl: data.heroImage1Url || defaultSettings.heroImage1Url || '',
          mobileType: 'image',
          mobileUrl: data.heroImage1Url || defaultSettings.heroImage1Url || '',
          button1: defaultButton1('Comprar ahora', 'Shop now', ''),
          button2: defaultButton2(),
          showTitleOverlay: true,
        },
        {
          id: 'legacy-slide-2',
          desktopType: data.heroSlide2Type || defaultSettings.heroSlide2Type || 'video',
          desktopUrl: (data.heroSlide2Type === 'image' ? data.heroImage3Url : data.heroVideoUrl) || '',
          mobileType: data.heroSlide2Type || defaultSettings.heroSlide2Type || 'video',
          mobileUrl: (data.heroSlide2Type === 'image' ? data.heroImage3Url : data.heroVideoUrl) || '',
          button1: defaultButton1('Comprar ahora', 'Shop now', ''),
          button2: defaultButton2(),
          showTitleOverlay: true,
        },
        {
          id: 'legacy-slide-3',
          desktopType: data.heroSlide3Type || defaultSettings.heroSlide3Type || 'image',
          desktopUrl: (data.heroSlide3Type === 'video' ? data.heroVideo2Url : data.heroImage2Url) || '',
          mobileType: data.heroSlide3Type || defaultSettings.heroSlide3Type || 'image',
          mobileUrl: (data.heroSlide3Type === 'video' ? data.heroVideo2Url : data.heroImage2Url) || '',
          button1: defaultButton1('Comprar ahora', 'Shop now', ''),
          button2: defaultButton2(),
          showTitleOverlay: true,
        }
      ];

      const rawSlides = data.heroSlides || legacySlides;
      const migratedSlides: HeroSlide[] = rawSlides.map((slide: any) => {
        if (slide.button1) {
          return {
            id: slide.id,
            desktopType: slide.desktopType,
            desktopUrl: slide.desktopUrl,
            mobileType: slide.mobileType,
            mobileUrl: slide.mobileUrl,
            button1: {
              text: slide.button1.text || 'Comprar ahora',
              textEn: slide.button1.textEn || 'Shop now',
              collectionId: slide.button1.collectionId || '',
              style: slide.button1.style || 'secondary',
              enabled: slide.button1.enabled !== false,
            },
            button2: {
              text: slide.button2?.text || '',
              textEn: slide.button2?.textEn || '',
              collectionId: slide.button2?.collectionId || '',
              style: slide.button2?.style || 'primary',
              enabled: !!slide.button2?.enabled,
            },
            showTitleOverlay: slide.showTitleOverlay !== false,
          };
        }
        
        return {
          id: slide.id,
          desktopType: slide.desktopType,
          desktopUrl: slide.desktopUrl,
          mobileType: slide.mobileType,
          mobileUrl: slide.mobileUrl,
          button1: {
            text: slide.buttonText || 'Comprar ahora',
            textEn: slide.buttonTextEn || 'Shop now',
            collectionId: slide.collectionId || '',
            style: 'secondary',
            enabled: true,
          },
          button2: {
            text: '',
            textEn: '',
            collectionId: '',
            style: 'primary',
            enabled: false,
          },
          showTitleOverlay: slide.showTitleOverlay !== false,
        };
      });

      cachedSettings = {
        shippingPrice: data.shippingPrice !== undefined ? data.shippingPrice : defaultSettings.shippingPrice,
        freeShippingMin: data.freeShippingMin !== undefined ? data.freeShippingMin : defaultSettings.freeShippingMin,
        markets: data.markets || defaultSettings.markets,
        admins: data.admins || defaultSettings.admins,
        logoUrl: data.logoUrl || defaultSettings.logoUrl,
        faviconUrl: data.faviconUrl || defaultSettings.faviconUrl,
        heroImage1Url: data.heroImage1Url || defaultSettings.heroImage1Url,
        heroVideoUrl: data.heroVideoUrl || defaultSettings.heroVideoUrl,
        heroImage2Url: data.heroImage2Url || defaultSettings.heroImage2Url,
        heroImage3Url: data.heroImage3Url || defaultSettings.heroImage3Url,
        heroVideo2Url: data.heroVideo2Url || defaultSettings.heroVideo2Url,
        heroSlide2Type: data.heroSlide2Type || defaultSettings.heroSlide2Type,
        heroSlide3Type: data.heroSlide3Type || defaultSettings.heroSlide3Type,
        heroCapsuleCollectionId: data.heroCapsuleCollectionId,
        heroSlides: migratedSlides,
        megaMenu: data.megaMenu,
        megaMenuHombre: data.megaMenuHombre,
        megaMenuMujer: data.megaMenuMujer,
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
