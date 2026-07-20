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
