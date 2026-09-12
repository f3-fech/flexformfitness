export const state = {
  orders: {
    currentPage: 1,
    pageHistory: [] as string[],
    nextVisibleId: null as string | null,
    searchDebounceTimer: null as any,
    loaded: false,
  },
  users: {
    currentPage: 1,
    pageHistory: [] as string[],
    nextVisibleId: null as string | null,
    searchDebounceTimer: null as any,
    loaded: false,
  },
  carts: {
    currentPage: 1,
    pageHistory: [] as string[],
    nextVisibleId: null as string | null,
    loaded: false,
  },
  contacts: {
    currentPage: 1,
    pageHistory: [] as string[],
    nextVisibleId: null as string | null,
    loaded: false,
  },
  product: {
    activeLang: 'es',
    translations: {
      title: '',
      description: '',
      title_en: '',
      description_en: '',
    },
    images: [] as string[],
  },
  collection: {
    activeLang: 'es',
    translations: {
      title: '',
      description: '',
      detailedDescription: '',
      seo_title: '',
      seo_keywords: '',
      seo_desc: '',
      title_en: '',
      description_en: '',
      detailedDescription_en: '',
      seo_title_en: '',
      seo_keywords_en: '',
      seo_desc_en: '',
    },
    currentOpenedFolderIds: [] as string[],
  },
  cropper: {
    instance: null as any,
    currentIndex: -1,
    currentUrl: '',
  },
  gallery: {
    activeInput: null as HTMLInputElement | null,
    activePreview: null as HTMLDivElement | null,
    selectedUrl: '',
    images: [] as Array<{ name: string; url: string }>,
  },
  videoGallery: {
    activeInput: null as HTMLInputElement | null,
    activePreview: null as HTMLDivElement | null,
    selectedUrl: '',
    videos: [] as Array<{ name: string; url: string }>,
  },
  branchIndex: 0,
};

let cachedCollections: any[] | null = null;
export function getDbCollections() {
  if (cachedCollections === null) {
    const collectionsDataEl = document.getElementById('collections-data-provider');
    cachedCollections = JSON.parse(collectionsDataEl?.getAttribute('data-collections') || '[]');
  }
  return cachedCollections;
}

export function setDbCollections(cols: any[]) {
  cachedCollections = cols;
  const collectionsDataEl = document.getElementById('collections-data-provider');
  if (collectionsDataEl) {
    collectionsDataEl.setAttribute('data-collections', JSON.stringify(cols));
  }
}

const defaultPresetColors = [
  { name: 'Negro', hex: '#0f172a' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Gris', hex: '#94a3b8' },
  { name: 'Gris Oscuro', hex: '#4b5563' },
  { name: 'Rosa', hex: '#db2777' },
  { name: 'Amarillo', hex: '#fbbf24' },
  { name: 'Azul Metalizado', hex: '#475569' },
  { name: 'Azul Marino', hex: '#1e3a8a' },
  { name: 'Azul Claro', hex: '#a5f3fc' },
  { name: 'Rojo', hex: '#dc2626' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Naranja', hex: '#ea580c' },
];

let cachedSavedColors: Array<{ name: string; hex: string }> | null = null;

export function getStoreColors(): Array<{ name: string; hex: string }> {
  if (cachedSavedColors === null) {
    const el = document.getElementById('saved-colors-data-provider');
    const raw = el?.getAttribute('data-colors');
    if (raw) {
      try {
        cachedSavedColors = JSON.parse(raw);
      } catch {
        cachedSavedColors = [];
      }
    }
    if (!cachedSavedColors || cachedSavedColors.length === 0) {
      cachedSavedColors = defaultPresetColors;
    }
  }
  return cachedSavedColors;
}

export function setStoreColors(colors: Array<{ name: string; hex: string }>) {
  cachedSavedColors = colors;
  const el = document.getElementById('saved-colors-data-provider');
  if (el) {
    el.setAttribute('data-colors', JSON.stringify(colors));
  }
}

