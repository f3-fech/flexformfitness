import { actions } from 'astro:actions';
import { getObjectPosition, getColorHex } from '../../lib/utils';
import { state, getDbCollections } from './state';
import { toggleModal, showToast, blobToBase64, handleImageUpload } from './utils';

// --- DOM Elements ---
const productModal = document.getElementById('product-modal') as HTMLDivElement;
const productForm = document.getElementById('product-form') as HTMLFormElement;
const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
const openNewProductModal = document.getElementById('open-new-product-modal') as HTMLButtonElement;
const closeProductModal = document.getElementById('close-product-modal') as HTMLButtonElement;
const cancelProductModal = document.getElementById('cancel-product-modal') as HTMLButtonElement;
const saveProductBtn = document.getElementById('save-product-btn') as HTMLButtonElement;

const cropModal = document.getElementById('crop-modal') as HTMLDivElement;
const closeCropModal = document.getElementById('close-crop-modal') as HTMLButtonElement;
const cancelCropBtn = document.getElementById('cancel-crop-btn') as HTMLButtonElement;
const saveCropBtn = document.getElementById('save-crop-btn') as HTMLButtonElement;
const cropPreviewImg = document.getElementById('crop-preview-img') as HTMLImageElement;

const searchProductsInput = document.getElementById('search-products') as HTMLInputElement;

const productLangSelect = document.getElementById('form-product-lang') as HTMLSelectElement;
const collectionLangSelect = document.getElementById('form-collection-lang') as HTMLSelectElement;

const titleInput = document.getElementById('form-title') as HTMLInputElement;
const slugInput = document.getElementById('form-slug') as HTMLInputElement;

const variantTreeContainer = document.getElementById('variant-tree-container') as HTMLDivElement;
const addColorBranchBtn = document.getElementById('add-color-branch') as HTMLButtonElement;

// Gallery Modal Elements
const galleryModal = document.getElementById('gallery-modal') as HTMLDivElement;
const closeGalleryModal = document.getElementById('close-gallery-modal') as HTMLButtonElement;
const cancelGalleryModal = document.getElementById('cancel-gallery-modal') as HTMLButtonElement;
const insertGalleryBtn = document.getElementById('insert-gallery-btn') as HTMLButtonElement;
const galleryGrid = document.getElementById('gallery-grid') as HTMLDivElement;
const galleryLoading = document.getElementById('gallery-loading') as HTMLDivElement;
const galleryEmpty = document.getElementById('gallery-empty') as HTMLDivElement;
const galleryUploadNewBtn = document.getElementById('gallery-upload-new-btn') as HTMLButtonElement;
const galleryFileInput = document.getElementById('gallery-file-input') as HTMLInputElement;
const deleteGalleryImgBtn = document.getElementById('delete-gallery-img-btn') as HTMLButtonElement;

// Collections Elements
const collectionModal = document.getElementById('collection-modal') as HTMLDivElement;
const collectionForm = document.getElementById('collection-form') as HTMLFormElement;
const collectionModalTitle = document.getElementById('collection-modal-title') as HTMLHeadingElement;
const openNewCollectionModal = document.getElementById('open-new-collection-modal') as HTMLButtonElement;
const closeCollectionModal = document.getElementById('close-collection-modal') as HTMLButtonElement;
const cancelCollectionModal = document.getElementById('cancel-collection-modal') as HTMLButtonElement;
const saveCollectionBtn = document.getElementById('save-collection-btn') as HTMLButtonElement;
const deleteCurrentCollectionBtn = document.getElementById('delete-current-collection-btn') as HTMLButtonElement;
const searchCollectionsInput = document.getElementById('search-collections') as HTMLInputElement;

// Folder Products associated view Elements
const collTabInfo = document.getElementById('coll-tab-info') as HTMLButtonElement;
const collTabProducts = document.getElementById('coll-tab-products') as HTMLButtonElement;
const collSecInfo = document.getElementById('coll-sec-info') as HTMLDivElement;
const collSecProducts = document.getElementById('coll-sec-products') as HTMLDivElement;
const collCatalogSearch = document.getElementById('coll-catalog-search') as HTMLInputElement;
const collCurrentList = document.getElementById('coll-current-list') as HTMLDivElement;

// --- 1. Product Collections Associations Render ---
export function renderProductCollections(productId: string | null) {
  const container = document.getElementById('product-collections-container');
  if (!container) return;

  container.innerHTML = '';
  const dbCollections = getDbCollections() || [];

  // Determine gender association from dbCollections
  let hasHombre = false;
  let hasMujer = false;
  
  if (productId) {
    const menCol = dbCollections.find((c: any) => c.slug === 'hombre');
    const womenCol = dbCollections.find((c: any) => c.slug === 'mujer');
    if (menCol && (menCol.productIds || []).includes(productId)) {
      hasHombre = true;
    }
    if (womenCol && (womenCol.productIds || []).includes(productId)) {
      hasMujer = true;
    }
  }

  // Update gender radio buttons
  const genderVal = (hasHombre && hasMujer) ? 'unisex' : hasHombre ? 'hombre' : hasMujer ? 'mujer' : '';
  document.querySelectorAll('input[name="product-gender-assoc"]').forEach((radio) => {
    const rEl = radio as HTMLInputElement;
    rEl.checked = (rEl.value === genderVal);
  });

  if (dbCollections.length === 0) {
    container.innerHTML = `<span class="text-slate-400 font-medium">No hay colecciones creadas en la tienda.</span>`;
    return;
  }

  dbCollections.forEach((col: any) => {
    // Exclude Hombre & Mujer collections from general list
    if (col.slug === 'hombre' || col.slug === 'mujer') return;

    const isAssociated = productId ? (col.productIds || []).includes(productId) : false;
    
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer select-none transition-colors border border-transparent hover:border-slate-200';
    label.innerHTML = `
      <input type="checkbox" name="product-col-assoc" value="${col.id}" ${isAssociated ? 'checked' : ''} class="w-3.5 h-3.5 text-rose-600 border-slate-355 rounded-sm focus:ring-rose-500 cursor-pointer" />
      <div class="flex flex-col">
        <span class="font-bold text-slate-800 text-[11px] leading-tight">${col.title}</span>
        <span class="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">Slug: ${col.slug}</span>
      </div>
    `;
    container.appendChild(label);
  });
}

// --- 2. Visual WYSIWYG Editor Helpers ---
const placeholders = ['customerName', 'orderId', 'orderItems', 'totalAmount', 'invoiceUrl', 'recoveryUrl', 'unsubscribeUrl'];

export function initVisualEditor(iframeId: string, textareaId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
  if (!iframe || !textarea) return;

  iframe.addEventListener('load', () => {
    setupIframeContent(iframe, textarea);
  });
  if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
    setupIframeContent(iframe, textarea);
  }
}

function setupIframeContent(iframe: HTMLIFrameElement, textarea: HTMLTextAreaElement) {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.designMode = "on";
  let rawHtml = textarea.value || '';

  placeholders.forEach(variableName => {
    const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
    const pillHTML = `<span contenteditable="false" style="background-color: #ffe4e6; color: #e11d48; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-weight: bold; border: 1px solid #fecdd3; display: inline-block; font-size: 11px; margin: 0 2px;">{{${variableName}}}</span>`;
    rawHtml = rawHtml.replace(regex, pillHTML);
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            margin: 0;
            min-height: 250px;
            outline: none;
            background-color: #ffffff;
            color: #334155;
            font-size: 14px;
            line-height: 1.6;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #f1f5f9; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        </style>
      </head>
      <body contenteditable="true">
        ${rawHtml}
      </body>
    </html>
  `);
  doc.close();

  const syncIframeToTextarea = () => {
    let bodyHtml = doc.body.innerHTML;
    placeholders.forEach(variableName => {
      const regex = new RegExp(`<span[^>]*contenteditable="false"[^>]*>\\s*({{\\s*${variableName}\\s*}})\\s*<\\/span>`, 'g');
      bodyHtml = bodyHtml.replace(regex, '$1');
    });
    textarea.value = bodyHtml;
  };

  doc.body.addEventListener('input', syncIframeToTextarea);
  doc.body.addEventListener('keyup', syncIframeToTextarea);
  doc.body.addEventListener('blur', syncIframeToTextarea);
}

export function updateVisualFromTextarea(iframeId: string, textareaId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
  if (!iframe || !textarea) return;

  const doc = iframe.contentDocument;
  if (!doc) return;

  let rawHtml = textarea.value || '';
  placeholders.forEach(variableName => {
    const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, 'g');
    const pillHTML = `<span contenteditable="false" style="background-color: #ffe4e6; color: #e11d48; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-weight: bold; border: 1px solid #fecdd3; display: inline-block; font-size: 11px; margin: 0 2px;">{{${variableName}}}</span>`;
    rawHtml = rawHtml.replace(regex, pillHTML);
  });

  doc.body.innerHTML = rawHtml;
}

export function setupToolbarListeners(iframeId: string, toolbarId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  const toolbar = document.getElementById(toolbarId);
  if (!iframe || !toolbar) return;

  toolbar.querySelectorAll('button[data-cmd]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-cmd');
      if (!cmd) return;
      
      iframe.contentDocument?.execCommand(cmd, false, undefined);
      const event = new Event('input', { bubbles: true });
      iframe.contentDocument?.body.dispatchEvent(event);
    });
  });
}

export function insertVariableAtCursor(iframeId: string, variableName: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  if (!iframe) return;

  iframe.contentWindow?.focus();
  const doc = iframe.contentDocument;
  if (!doc) return;

  const pillHTML = `<span contenteditable="false" style="background-color: #ffe4e6; color: #e11d48; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-weight: bold; border: 1px solid #fecdd3; display: inline-block; font-size: 11px; margin: 0 2px;">{{${variableName}}}</span>&nbsp;`;
  doc.execCommand('insertHTML', false, pillHTML);
}

// Global applyFormatting helper for raw textareas
(window as any).applyFormatting = function(textareaId: string, tag: string) {
  const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);

  let replacement = "";
  if (tag === 'link') {
    const url = prompt("Introduce la URL del enlace:", "https://");
    if (url === null) return;
    replacement = `<a href="${url}">${selectedText || 'Enlace'}</a>`;
  } else if (tag === 'ul') {
    replacement = `<ul>\n  <li>${selectedText || 'Elemento 1'}</li>\n  <li>Elemento 2</li>\n</ul>`;
  } else {
    replacement = `<${tag}>${selectedText}</${tag}>`;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
  const newCursorPos = start + replacement.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
};

// Initialize visual email editors
initVisualEditor('iframe-editor-order', 'email-order-body');
setupToolbarListeners('iframe-editor-order', 'toolbar-visual-order');

initVisualEditor('iframe-editor-abandoned', 'email-abandoned-body');
setupToolbarListeners('iframe-editor-abandoned', 'toolbar-visual-abandoned');

initVisualEditor('iframe-editor-shipped', 'email-shipped-body');
setupToolbarListeners('iframe-editor-shipped', 'toolbar-visual-shipped');

// Insert variable button actions
document.getElementById('btn-insert-var-order')?.addEventListener('click', (e) => {
  e.preventDefault();
  const vars = ['customerName', 'orderId', 'orderItems', 'totalAmount', 'invoiceUrl'];
  const choice = prompt(`Escribe el número de la variable a insertar:\n\n` + vars.map((v, i) => `${i + 1}. ${v}`).join('\n'));
  if (choice) {
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < vars.length) {
      insertVariableAtCursor('iframe-editor-order', vars[idx]);
      const iframe = document.getElementById('iframe-editor-order') as HTMLIFrameElement;
      iframe.contentDocument?.body.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      alert('Número de variable inválido.');
    }
  }
});

document.getElementById('btn-insert-var-abandoned')?.addEventListener('click', (e) => {
  e.preventDefault();
  const vars = ['customerName', 'orderItems', 'recoveryUrl', 'unsubscribeUrl'];
  const choice = prompt(`Escribe el número de la variable a insertar:\n\n` + vars.map((v, i) => `${i + 1}. ${v}`).join('\n'));
  if (choice) {
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < vars.length) {
      insertVariableAtCursor('iframe-editor-abandoned', vars[idx]);
      const iframe = document.getElementById('iframe-editor-abandoned') as HTMLIFrameElement;
      iframe.contentDocument?.body.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      alert('Número de variable inválido.');
    }
  }
});

document.getElementById('btn-insert-var-shipped')?.addEventListener('click', (e) => {
  e.preventDefault();
  const vars = ['customerName', 'orderId', 'trackingNumber', 'trackingUrl'];
  const choice = prompt(`Escribe el número de la variable a insertar:\n\n` + vars.map((v, i) => `${i + 1}. ${v}`).join('\n'));
  if (choice) {
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < vars.length) {
      insertVariableAtCursor('iframe-editor-shipped', vars[idx]);
      const iframe = document.getElementById('iframe-editor-shipped') as HTMLIFrameElement;
      iframe.contentDocument?.body.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      alert('Número de variable inválido.');
    }
  }
});

// Mode toggles helpers
function setupModeToggles(visualBtnId: string, htmlBtnId: string, visualContId: string, htmlContId: string, toolbarId: string, iframeId: string, textareaId: string) {
  const visualBtn = document.getElementById(visualBtnId);
  const htmlBtn = document.getElementById(htmlBtnId);
  const visualCont = document.getElementById(visualContId);
  const htmlCont = document.getElementById(htmlContId);
  const toolbar = document.getElementById(toolbarId);

  visualBtn?.addEventListener('click', () => {
    visualBtn.className = "px-3 py-1.5 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
    htmlBtn?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
    htmlBtn?.classList.add('text-slate-500', 'hover:text-slate-900');
    visualCont?.classList.remove('hidden');
    htmlCont?.classList.add('hidden');
    if (toolbar) toolbar.style.display = 'flex';
    updateVisualFromTextarea(iframeId, textareaId);
  });

  htmlBtn?.addEventListener('click', () => {
    htmlBtn.className = "px-3 py-1.5 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
    visualBtn?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
    visualBtn?.classList.add('text-slate-500', 'hover:text-slate-900');
    visualCont?.classList.add('hidden');
    htmlCont?.classList.remove('hidden');
    if (toolbar) toolbar.style.display = 'none';
  });
}

setupModeToggles('btn-mode-visual-order', 'btn-mode-html-order', 'container-visual-order', 'container-html-order', 'toolbar-visual-order', 'iframe-editor-order', 'email-order-body');
setupModeToggles('btn-mode-visual-abandoned', 'btn-mode-html-abandoned', 'container-visual-abandoned', 'container-html-abandoned', 'toolbar-visual-abandoned', 'iframe-editor-abandoned', 'email-abandoned-body');
setupModeToggles('btn-mode-visual-shipped', 'btn-mode-html-shipped', 'container-visual-shipped', 'container-html-shipped', 'toolbar-visual-shipped', 'iframe-editor-shipped', 'email-shipped-body');

// --- 3. Collection WYSIWYG Editors Setup ---
function setupCollectionLinkBtn(btnId: string, iframeId: string) {
  document.getElementById(btnId)?.addEventListener('click', (e) => {
    e.preventDefault();
    const url = prompt('Introduce la URL del enlace:');
    if (url) {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      iframe.contentWindow?.focus();
      iframe.contentDocument?.execCommand('createLink', false, url);
      iframe.contentDocument?.body.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function setupCollectionToolbarListeners(toolbarId: string, iframeId: string) {
  const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  const toolbar = document.getElementById(toolbarId);
  if (!iframe || !toolbar) return;

  toolbar.querySelectorAll('button[data-colcmd]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cmd = btn.getAttribute('data-colcmd');
      const val = btn.getAttribute('data-val') || undefined;
      if (!cmd) return;
      
      iframe.contentWindow?.focus();
      iframe.contentDocument?.execCommand(cmd, false, val);
      iframe.contentDocument?.body.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

initVisualEditor('iframe-col-desc', 'form-collection-desc');
setupCollectionToolbarListeners('coltoolbar-visual-desc', 'iframe-col-desc');
setupCollectionLinkBtn('btn-collink-desc', 'iframe-col-desc');

initVisualEditor('iframe-col-det', 'form-collection-detailed-desc');
setupCollectionToolbarListeners('coltoolbar-visual-det', 'iframe-col-det');
setupCollectionLinkBtn('btn-collink-det', 'iframe-col-det');

// Collection Description editors toggles
const btnColmodeVisualDesc = document.getElementById('btn-colmode-visual-desc');
const btnColmodeHtmlDesc = document.getElementById('btn-colmode-html-desc');
const colcontainerVisualDesc = document.getElementById('colcontainer-visual-desc');
const colcontainerHtmlDesc = document.getElementById('colcontainer-html-desc');
const coltoolbarVisualDesc = document.getElementById('coltoolbar-visual-desc');

btnColmodeVisualDesc?.addEventListener('click', () => {
  btnColmodeVisualDesc.className = "px-2.5 py-1 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
  btnColmodeHtmlDesc?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
  btnColmodeHtmlDesc?.classList.add('text-slate-500', 'hover:text-slate-900');
  colcontainerVisualDesc?.classList.remove('hidden');
  colcontainerHtmlDesc?.classList.add('hidden');
  if (coltoolbarVisualDesc) coltoolbarVisualDesc.style.display = 'flex';
  updateVisualFromTextarea('iframe-col-desc', 'form-collection-desc');
});

btnColmodeHtmlDesc?.addEventListener('click', () => {
  btnColmodeHtmlDesc.className = "px-2.5 py-1 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
  btnColmodeVisualDesc?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
  btnColmodeVisualDesc?.classList.add('text-slate-500', 'hover:text-slate-900');
  colcontainerVisualDesc?.classList.add('hidden');
  colcontainerHtmlDesc?.classList.remove('hidden');
  if (coltoolbarVisualDesc) coltoolbarVisualDesc.style.display = 'none';
});

// Collection Detailed Description editors toggles
const btnColmodeVisualDet = document.getElementById('btn-colmode-visual-det');
const btnColmodeHtmlDet = document.getElementById('btn-colmode-html-det');
const colcontainerVisualDet = document.getElementById('colcontainer-visual-det');
const colcontainerHtmlDet = document.getElementById('colcontainer-html-det');
const coltoolbarVisualDet = document.getElementById('coltoolbar-visual-det');

btnColmodeVisualDet?.addEventListener('click', () => {
  btnColmodeVisualDet.className = "px-2.5 py-1 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
  btnColmodeHtmlDet?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
  btnColmodeHtmlDet?.classList.add('text-slate-500', 'hover:text-slate-900');
  colcontainerVisualDet?.classList.remove('hidden');
  colcontainerHtmlDet?.classList.add('hidden');
  if (coltoolbarVisualDet) coltoolbarVisualDet.style.display = 'flex';
  updateVisualFromTextarea('iframe-col-det', 'form-collection-detailed-desc');
});

btnColmodeHtmlDet?.addEventListener('click', () => {
  btnColmodeHtmlDet.className = "px-2.5 py-1 rounded-md bg-white text-rose-600 shadow-3xs transition-all focus:outline-none";
  btnColmodeVisualDet?.classList.remove('bg-white', 'text-rose-600', 'shadow-3xs');
  btnColmodeVisualDet?.classList.add('text-slate-500', 'hover:text-slate-900');
  colcontainerVisualDet?.classList.add('hidden');
  colcontainerHtmlDet?.classList.remove('hidden');
  if (coltoolbarVisualDet) coltoolbarVisualDet.style.display = 'none';
});

// --- 4. Language Translation Syncing Helpers ---
function syncProductFormToState(lang: string) {
  const titleVal = (document.getElementById('form-title') as HTMLInputElement).value;
  const descVal = (document.getElementById('form-description') as HTMLTextAreaElement).value;
  
  if (lang === 'es') {
    state.product.translations.title = titleVal;
    state.product.translations.description = descVal;
  } else {
    state.product.translations.title_en = titleVal;
    state.product.translations.description_en = descVal;
  }
}

function syncProductStateToForm(lang: string) {
  if (lang === 'es') {
    (document.getElementById('form-title') as HTMLInputElement).value = state.product.translations.title;
    (document.getElementById('form-description') as HTMLTextAreaElement).value = state.product.translations.description;
  } else {
    (document.getElementById('form-title') as HTMLInputElement).value = state.product.translations.title_en;
    (document.getElementById('form-description') as HTMLTextAreaElement).value = state.product.translations.description_en;
  }
}

productLangSelect?.addEventListener('change', () => {
  const nextLang = productLangSelect.value;
  if (nextLang === state.product.activeLang) return;
  
  syncProductFormToState(state.product.activeLang);
  state.product.activeLang = nextLang;
  syncProductStateToForm(state.product.activeLang);
});

function syncCollectionFormToState(lang: string) {
  const titleVal = (document.getElementById('form-collection-title') as HTMLInputElement).value;
  const descVal = (document.getElementById('form-collection-desc') as HTMLTextAreaElement).value;
  const detailedDescVal = (document.getElementById('form-collection-detailed-desc') as HTMLTextAreaElement).value;
  const seoTitleVal = (document.getElementById('form-collection-seo-title') as HTMLInputElement).value;
  const seoKeywordsVal = (document.getElementById('form-collection-seo-keywords') as HTMLInputElement).value;
  const seoDescVal = (document.getElementById('form-collection-seo-desc') as HTMLTextAreaElement).value;
  
  if (lang === 'es') {
    state.collection.translations.title = titleVal;
    state.collection.translations.description = descVal;
    state.collection.translations.detailedDescription = detailedDescVal;
    state.collection.translations.seo_title = seoTitleVal;
    state.collection.translations.seo_keywords = seoKeywordsVal;
    state.collection.translations.seo_desc = seoDescVal;
  } else {
    state.collection.translations.title_en = titleVal;
    state.collection.translations.description_en = descVal;
    state.collection.translations.detailedDescription_en = detailedDescVal;
    state.collection.translations.seo_title_en = seoTitleVal;
    state.collection.translations.seo_keywords_en = seoKeywordsVal;
    state.collection.translations.seo_desc_en = seoDescVal;
  }
}

function syncCollectionStateToForm(lang: string) {
  const collectionSlugInput = document.getElementById('form-collection-slug') as HTMLInputElement;
  const currentSlug = collectionSlugInput?.value;

  if (lang === 'es') {
    (document.getElementById('form-collection-title') as HTMLInputElement).value = state.collection.translations.title;
    (document.getElementById('form-collection-desc') as HTMLTextAreaElement).value = state.collection.translations.description;
    (document.getElementById('form-collection-detailed-desc') as HTMLTextAreaElement).value = state.collection.translations.detailedDescription;
    (document.getElementById('form-collection-seo-title') as HTMLInputElement).value = state.collection.translations.seo_title;
    (document.getElementById('form-collection-seo-keywords') as HTMLInputElement).value = state.collection.translations.seo_keywords;
    (document.getElementById('form-collection-seo-desc') as HTMLTextAreaElement).value = state.collection.translations.seo_desc;

    if (collectionSlugInput && currentSlug !== 'hombre' && currentSlug !== 'mujer') {
      collectionSlugInput.readOnly = false;
      collectionSlugInput.classList.remove('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
    }
  } else {
    (document.getElementById('form-collection-title') as HTMLInputElement).value = state.collection.translations.title_en;
    (document.getElementById('form-collection-desc') as HTMLTextAreaElement).value = state.collection.translations.description_en;
    (document.getElementById('form-collection-detailed-desc') as HTMLTextAreaElement).value = state.collection.translations.detailedDescription_en;
    (document.getElementById('form-collection-seo-title') as HTMLInputElement).value = state.collection.translations.seo_title_en;
    (document.getElementById('form-collection-seo-keywords') as HTMLInputElement).value = state.collection.translations.seo_keywords_en;
    (document.getElementById('form-collection-seo-desc') as HTMLTextAreaElement).value = state.collection.translations.seo_desc_en;

    if (collectionSlugInput) {
      collectionSlugInput.readOnly = true;
      collectionSlugInput.classList.add('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
    }
  }

  updateVisualFromTextarea('iframe-col-desc', 'form-collection-desc');
  updateVisualFromTextarea('iframe-col-det', 'form-collection-detailed-desc');
}

collectionLangSelect?.addEventListener('change', () => {
  const nextLang = collectionLangSelect.value;
  if (nextLang === state.collection.activeLang) return;
  
  syncCollectionFormToState(state.collection.activeLang);
  state.collection.activeLang = nextLang;
  syncCollectionStateToForm(state.collection.activeLang);
});

// --- 5. New Product & Image Cropping Modal ---
openNewProductModal?.addEventListener('click', () => {
  productForm.reset();
  state.product.activeLang = 'es';
  if (productLangSelect) productLangSelect.value = 'es';
  state.product.translations = { title: '', description: '', title_en: '', description_en: '' };
  modalTitle.textContent = "Nuevo Producto";
  (document.getElementById('form-product-id') as HTMLInputElement).value = "";
  
  state.product.images = [];
  renderProductMedia();

  variantTreeContainer.innerHTML = '';
  addColorBranch('negro', '#0f172a', '', [
    { size: 'xs', sku: '', price: '', stock: '10' },
    { size: 's', sku: '', price: '', stock: '10' },
    { size: 'm', sku: '', price: '', stock: '10' }
  ]);
  updateGeneralStockSum();
  renderProductCollections(null);
  toggleModal(productModal, true);
});

closeProductModal?.addEventListener('click', () => toggleModal(productModal, false));
cancelProductModal?.addEventListener('click', () => toggleModal(productModal, false));

function getOriginalUrl(url: string | undefined): string {
  if (!url) return "";
  const match = url.match(/#org=(.+)$/);
  if (match && match[1]) {
    return match[1];
  }
  return url.split('#')[0];
}

function openCropModal(imageUrl: string, imageIndex: number) {
  state.cropper.currentIndex = imageIndex;
  state.cropper.currentUrl = imageUrl;
  
  const originalUrl = getOriginalUrl(imageUrl);
  
  if (cropPreviewImg) {
    if (state.cropper.instance) {
      state.cropper.instance.destroy();
      state.cropper.instance = null;
    }
    
    cropPreviewImg.crossOrigin = "anonymous";
    cropPreviewImg.src = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
    
    cropPreviewImg.onload = () => {
      // @ts-ignore
      state.cropper.instance = new (window as any).Cropper(cropPreviewImg, {
        aspectRatio: 3 / 4,
        viewMode: 1,
        autoCropArea: 0.9,
        responsive: true,
        restore: true,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        checkCrossOrigin: true
      });
      cropPreviewImg.onload = null;
    };

    cropPreviewImg.onerror = () => {
      console.error("Cropper failed to load image via proxy:", originalUrl);
      alert("Error al cargar la imagen original para recortar. Verifique que el enlace sea correcto.");
      closeCrop();
    };
  }
  
  toggleModal(cropModal, true);
}

saveCropBtn?.addEventListener('click', () => {
  if (state.cropper.instance && state.cropper.currentIndex !== -1 && state.cropper.currentUrl) {
    saveCropBtn.disabled = true;
    const originalText = saveCropBtn.innerHTML;
    saveCropBtn.innerHTML = "Guardando...";
    
    const croppedCanvas = state.cropper.instance.getCroppedCanvas({
      maxWidth: 2400,
      maxHeight: 3200,
      imageSmoothingQuality: 'high'
    });
    
    if (!croppedCanvas) {
      alert("Error al recortar la imagen.");
      saveCropBtn.disabled = false;
      saveCropBtn.innerHTML = originalText;
      return;
    }

    croppedCanvas.toBlob(async (blob: Blob | null) => {
      if (!blob) {
        alert("Error al generar el archivo de imagen.");
        saveCropBtn.disabled = false;
        saveCropBtn.innerHTML = originalText;
        return;
      }

      try {
        const base64Data = await blobToBase64(blob);
        const originalUrl = getOriginalUrl(state.cropper.currentUrl);
        const match = originalUrl.match(/\/o\/([^?#]+)/);
        let cleanBaseName = '';
        if (match && match[1]) {
          const fullPath = decodeURIComponent(match[1]);
          const originalFileName = fullPath.split('/').pop() || '';
          cleanBaseName = originalFileName.replace(/\.[^/.]+$/, "");
        }
        const prefixName = cleanBaseName ? `crop_${cleanBaseName}` : 'crop';
        const fileName = `${prefixName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;

        const { data, error } = await actions.uploadImage({ base64Data, fileName, folder: 'products/crops' });
        if (error || !data?.success || !data?.url) {
          throw new Error(error?.message || 'Error al subir la imagen recortada.');
        }

        const oldCroppedUrl = state.cropper.currentUrl.split('#')[0];
        if (decodeURIComponent(oldCroppedUrl).includes('/crops/crop_')) {
          try {
            await actions.deleteImage({ url: oldCroppedUrl });
          } catch (delErr) {
            console.warn("Failed to delete old cropped image file:", delErr);
          }
        }

        const newUrl = `${data.url}#org=${originalUrl}`;
        state.product.images[state.cropper.currentIndex] = newUrl;
        renderProductMedia();
        closeCrop();
      } catch (err: any) {
        console.error("Cropper save error:", err);
        alert("Error al guardar el recorte: " + err.message);
      } finally {
        saveCropBtn.disabled = false;
        saveCropBtn.innerHTML = originalText;
      }
    }, 'image/webp', 0.95);
  }
});

const closeCrop = () => {
  if (state.cropper.instance) {
    state.cropper.instance.destroy();
    state.cropper.instance = null;
  }
  toggleModal(cropModal, false);
};

closeCropModal?.addEventListener('click', closeCrop);
cancelCropBtn?.addEventListener('click', closeCrop);

// --- 6. SKU and Slug Computation ---
function cleanSkuPart(val: string): string {
  return val
    .toUpperCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function updateAllSKUs() {
  if (!slugInput) return;
  const slugVal = cleanSkuPart(slugInput.value);
  const productBranches = document.querySelectorAll('.color-branch');
  
  productBranches.forEach((branch) => {
    const colorNameInput = branch.querySelector('.color-name') as HTMLInputElement;
    if (!colorNameInput) return;
    const colorVal = cleanSkuPart(colorNameInput.value);
    const sizeRows = branch.querySelectorAll('.size-row');
    
    sizeRows.forEach((row) => {
      const sizeInput = row.querySelector('.size-name') as HTMLInputElement;
      const skuInput = row.querySelector('.size-sku') as HTMLInputElement;
      if (!sizeInput || !skuInput) return;
      const sizeVal = cleanSkuPart(sizeInput.value);
      
      const parts = [slugVal, colorVal, sizeVal].filter(Boolean);
      skuInput.value = parts.join('-');
    });
  });
}

function updateSKUsForBranch(branchEl: HTMLElement) {
  if (!slugInput) return;
  const slugVal = cleanSkuPart(slugInput.value);
  const colorNameInput = branchEl.querySelector('.color-name') as HTMLInputElement;
  if (!colorNameInput) return;
  const colorVal = cleanSkuPart(colorNameInput.value);
  
  const sizeRows = branchEl.querySelectorAll('.size-row');
  sizeRows.forEach((row) => {
    const sizeInput = row.querySelector('.size-name') as HTMLInputElement;
    const skuInput = row.querySelector('.size-sku') as HTMLInputElement;
    if (!sizeInput || !skuInput) return;
    const sizeVal = cleanSkuPart(sizeInput.value);
    
    const parts = [slugVal, colorVal, sizeVal].filter(Boolean);
    skuInput.value = parts.join('-');
  });
}

titleInput?.addEventListener('input', () => {
  const idVal = (document.getElementById('form-product-id') as HTMLInputElement).value;
  if (!idVal) {
    slugInput.value = titleInput.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    updateAllSKUs();
  }
});

slugInput?.addEventListener('input', updateAllSKUs);

// --- 7. Drag-and-drop Product Multimedia Grid ---
export function renderProductMedia() {
  const mediaContainer = document.getElementById('media-container') as HTMLDivElement;
  if (!mediaContainer) return;

  mediaContainer.innerHTML = "";

  if (state.product.images.length === 0) {
    mediaContainer.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-6 text-slate-400 gap-1 select-none">
        <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <span class="text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Sin imágenes</span>
      </div>
    `;
    return;
  }

  state.product.images.forEach((url, idx) => {
    const card = document.createElement('div');
    card.className = "group relative aspect-[3/4] bg-white border border-slate-200 rounded-xl overflow-hidden cursor-move transition-all duration-200 select-none shadow-3xs hover:border-rose-400";
    if (idx === 0) {
      card.className += " ring-2 ring-rose-600 border-rose-600";
    }
    card.setAttribute('draggable', 'true');
    card.dataset.index = idx.toString();

    card.innerHTML = `
      <img src="${url}" class="w-full h-full object-cover pointer-events-none" style="object-position: ${getObjectPosition(url)}" />
      ${idx === 0 ? '<span class="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[7px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded shadow-3xs">Portada</span>' : ''}
      <button type="button" class="remove-media-item-btn absolute top-1 right-1 bg-slate-900/60 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar Imagen">×</button>
    `;

    card.addEventListener('dblclick', (e) => {
      e.preventDefault();
      openCropModal(url, idx);
    });

    card.querySelector('.remove-media-item-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      state.product.images.splice(idx, 1);
      renderProductMedia();
    });

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', idx.toString());
      card.classList.add('opacity-40', 'scale-95');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-40', 'scale-95');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('border-rose-500', 'bg-rose-50/10');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-rose-500', 'bg-rose-50/10');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('border-rose-500', 'bg-rose-50/10');
      const sourceIdx = parseInt(e.dataTransfer?.getData('text/plain') || '-1');
      const targetIdx = idx;

      if (sourceIdx !== -1 && sourceIdx !== targetIdx) {
        const draggedItem = state.product.images[sourceIdx];
        state.product.images.splice(sourceIdx, 1);
        state.product.images.splice(targetIdx, 0, draggedItem);
        renderProductMedia();
      }
    });

    mediaContainer.appendChild(card);
  });
}

// Open gallery to select image for main catalog media
document.getElementById('add-media-btn')?.addEventListener('click', () => {
  state.gallery.activeInput = null;
  state.gallery.activePreview = null;
  toggleGalleryModal(true);
});

// --- 8. Shopify-style Image Gallery Logic ---
export function toggleGalleryModal(show: boolean) {
  if (show) {
    toggleModal(galleryModal, true);
    loadGalleryImages();
  } else {
    toggleModal(galleryModal, false);
    state.gallery.selectedUrl = "";
    insertGalleryBtn.disabled = true;
    deleteGalleryImgBtn?.classList.add('hidden');
  }
}

async function loadGalleryImages() {
  galleryGrid.innerHTML = "";
  galleryLoading.classList.remove('hidden');
  galleryEmpty.classList.add('hidden');

  try {
    const { data, error } = await actions.listUploadedImages();
    if (error || !data?.success) {
      console.error("Error loading gallery:", error);
      alert("Error al cargar la galería de imágenes.");
      return;
    }

    state.gallery.images = (data.images || []).filter((img) => !img.name.startsWith('crop_'));

    if (state.gallery.images.length === 0) {
      galleryEmpty.classList.remove('hidden');
    } else {
      state.gallery.images.forEach((img) => {
        const card = document.createElement('div');
        card.className = "group relative aspect-[3/4] bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-rose-500 hover:shadow-sm transition-all duration-200";
        card.innerHTML = `
          <img src="${img.url}" class="w-full h-full object-cover select-none" alt="${img.name}" />
          <div class="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute bottom-0 inset-x-0 bg-slate-900/70 p-1 px-2 text-[8px] text-white truncate font-mono select-none">${img.name}</div>
        `;
        
        card.addEventListener('click', () => {
          galleryGrid.querySelectorAll('.selected-gallery-card').forEach((el) => {
            el.classList.remove('selected-gallery-card', 'border-rose-600', 'ring-2', 'ring-rose-600');
            el.classList.add('border-slate-200');
          });

          card.classList.add('selected-gallery-card', 'border-rose-600', 'ring-2', 'ring-rose-600');
          card.classList.remove('border-slate-200');

          state.gallery.selectedUrl = img.url;
          insertGalleryBtn.disabled = false;
          deleteGalleryImgBtn?.classList.remove('hidden');
        });

        galleryGrid.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Error fetching images:", err);
  } finally {
    galleryLoading.classList.add('hidden');
  }
}

function openGallery(inputEl: HTMLInputElement, previewEl: HTMLDivElement) {
  state.gallery.activeInput = inputEl;
  state.gallery.activePreview = previewEl;
  toggleGalleryModal(true);
}

// Bind all open-gallery buttons dynamically/statically
document.querySelectorAll('.open-gallery-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const inputId = target.dataset.inputId || "";
    const previewId = target.dataset.previewId || "";
    const inputEl = document.getElementById(inputId) as HTMLInputElement;
    const previewEl = document.getElementById(previewId) as HTMLDivElement;
    if (inputEl && previewEl) {
      openGallery(inputEl, previewEl);
    }
  });
});

closeGalleryModal?.addEventListener('click', () => toggleGalleryModal(false));
cancelGalleryModal?.addEventListener('click', () => toggleGalleryModal(false));

deleteGalleryImgBtn?.addEventListener('click', async () => {
  if (!state.gallery.selectedUrl) return;
  const imgName = state.gallery.selectedUrl.split('?')[0].split('/').pop();
  const decodedName = imgName ? decodeURIComponent(imgName).replace('products/', '') : 'imagen';
  
  if (confirm(`¿Estás seguro de que deseas eliminar la imagen "${decodedName}" permanentemente de la base de datos?`)) {
    deleteGalleryImgBtn.disabled = true;
    const originalText = deleteGalleryImgBtn.textContent;
    deleteGalleryImgBtn.textContent = "Eliminando...";
    
    try {
      const { error } = await actions.deleteImage({ url: state.gallery.selectedUrl });
      if (error) throw error;
      showToast("Imagen eliminada de la galería.");
      
      state.gallery.selectedUrl = "";
      insertGalleryBtn.disabled = true;
      deleteGalleryImgBtn.classList.add('hidden');
      loadGalleryImages();
    } catch (err: any) {
      console.error("Error deleting gallery image:", err);
      alert("Error al eliminar la imagen: " + (err.message || err.code));
    } finally {
      deleteGalleryImgBtn.disabled = false;
      deleteGalleryImgBtn.textContent = originalText;
    }
  }
});

insertGalleryBtn?.addEventListener('click', () => {
  if (state.gallery.selectedUrl) {
    if (state.gallery.activeInput && state.gallery.activePreview) {
      state.gallery.activeInput.value = state.gallery.selectedUrl;
      state.gallery.activeInput.dispatchEvent(new Event('input'));
      state.gallery.activePreview.innerHTML = `<img src="${state.gallery.selectedUrl}" class="w-full h-full object-contain" />`;
    } else {
      state.product.images.push(state.gallery.selectedUrl);
      renderProductMedia();
    }
    toggleGalleryModal(false);
  }
});

galleryUploadNewBtn?.addEventListener('click', () => {
  galleryFileInput.click();
});

galleryFileInput?.addEventListener('change', async () => {
  const file = galleryFileInput.files?.[0];
  if (!file) return;

  galleryUploadNewBtn.disabled = true;
  const originalText = galleryUploadNewBtn.innerHTML;
  galleryUploadNewBtn.innerHTML = 'Subiendo...';

  try {
    await handleImageUpload(file, 'gallery');
    await loadGalleryImages();
    
    const firstCard = galleryGrid.firstElementChild as HTMLDivElement;
    if (firstCard) {
      firstCard.click();
    }
  } catch (err) {
    console.error("Gallery upload error:", err);
    alert("Error al subir la imagen.");
  } finally {
    galleryUploadNewBtn.disabled = false;
    galleryUploadNewBtn.innerHTML = originalText;
    galleryFileInput.value = "";
  }
});

// --- 9. Video Gallery Modal Logic ---
const videoGalleryModal = document.getElementById('video-gallery-modal') as HTMLDivElement;
const closeVideoGalleryModal = document.getElementById('close-video-gallery-modal') as HTMLButtonElement;
const cancelVideoGalleryModal = document.getElementById('cancel-video-gallery-modal') as HTMLButtonElement;
const insertVideoGalleryBtn = document.getElementById('insert-video-gallery-btn') as HTMLButtonElement;
const videoGalleryGrid = document.getElementById('video-gallery-grid') as HTMLDivElement;
const videoGalleryLoading = document.getElementById('video-gallery-loading') as HTMLDivElement;
const videoGalleryEmpty = document.getElementById('video-gallery-empty') as HTMLDivElement;
const videoGalleryUploadNewBtn = document.getElementById('video-gallery-upload-new-btn') as HTMLButtonElement;
const videoGalleryFileInput = document.getElementById('video-gallery-file-input') as HTMLInputElement;
const openVideoGalleryBtn = document.getElementById('open-video-gallery-btn') as HTMLButtonElement;

function toggleVideoGalleryModal(show: boolean) {
  if (show) {
    toggleModal(videoGalleryModal, true);
    loadGalleryVideos();
  } else {
    toggleModal(videoGalleryModal, false);
    state.videoGallery.selectedUrl = "";
    insertVideoGalleryBtn.disabled = true;
  }
}

async function loadGalleryVideos() {
  if (!videoGalleryGrid) return;
  videoGalleryGrid.innerHTML = "";
  videoGalleryLoading.classList.remove('hidden');
  videoGalleryEmpty.classList.add('hidden');

  try {
    const { data, error } = await actions.listUploadedVideos();
    if (error || !data?.success) {
      console.error("Error loading gallery videos:", error);
      alert("Error al cargar la galería de videos.");
      return;
    }

    state.videoGallery.videos = data.videos || [];

    if (state.videoGallery.videos.length === 0) {
      videoGalleryEmpty.classList.remove('hidden');
    } else {
      state.videoGallery.videos.forEach((vid) => {
        const card = document.createElement('div');
        card.className = "group relative aspect-video bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-rose-500 hover:shadow-sm transition-all duration-200";
        card.innerHTML = `
          <video src="${vid.url}" class="w-full h-full object-cover select-none pointer-events-none" muted></video>
          <div class="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg class="w-8 h-8 text-white filter drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div class="absolute bottom-0 inset-x-0 bg-slate-900/70 p-1 px-2 text-[8px] text-white truncate font-mono select-none">${vid.name}</div>
          <button type="button" class="delete-video-btn absolute top-1 right-1 bg-slate-900/60 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar Video">×</button>
        `;
        
        card.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          if (target.classList.contains('delete-video-btn')) return;

          videoGalleryGrid.querySelectorAll('.selected-video-card').forEach((el) => {
            el.classList.remove('selected-video-card', 'border-rose-600', 'ring-2', 'ring-rose-600');
            el.classList.add('border-slate-200');
          });

          card.classList.add('selected-video-card', 'border-rose-600', 'ring-2', 'ring-rose-600');
          card.classList.remove('border-slate-200');

          state.videoGallery.selectedUrl = vid.url;
          insertVideoGalleryBtn.disabled = false;
        });

        card.querySelector('.delete-video-btn')?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(`¿Estás seguro de que quieres eliminar el video "${vid.name}"?`)) return;

          try {
            const { error } = await actions.deleteVideo({ url: vid.url });
            if (error) throw error;
            alert('Video eliminado con éxito.');
            loadGalleryVideos();
          } catch (err: any) {
            console.error('Error deleting video:', err);
            alert('Error al eliminar el video: ' + (err.message || err.code));
          }
        });

        videoGalleryGrid.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Error fetching videos:", err);
  } finally {
    videoGalleryLoading.classList.add('hidden');
  }
}

openVideoGalleryBtn?.addEventListener('click', () => toggleVideoGalleryModal(true));
closeVideoGalleryModal?.addEventListener('click', () => toggleVideoGalleryModal(false));
cancelVideoGalleryModal?.addEventListener('click', () => toggleVideoGalleryModal(false));

insertVideoGalleryBtn?.addEventListener('click', () => {
  if (state.videoGallery.selectedUrl) {
    if (state.videoGallery.activeInput && state.videoGallery.activePreview) {
      state.videoGallery.activeInput.value = state.videoGallery.selectedUrl;
      state.videoGallery.activeInput.dispatchEvent(new Event('input'));
      state.videoGallery.activePreview.innerHTML = `<video src="${state.videoGallery.selectedUrl}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
    } else {
      const heroVideoInput = document.getElementById('settings-hero-video') as HTMLInputElement;
      if (heroVideoInput) {
        heroVideoInput.value = state.videoGallery.selectedUrl;
        heroVideoInput.dispatchEvent(new Event('input'));
      }
    }
    toggleVideoGalleryModal(false);
  }
});

videoGalleryUploadNewBtn?.addEventListener('click', () => {
  videoGalleryFileInput.click();
});

videoGalleryFileInput?.addEventListener('change', async () => {
  const file = videoGalleryFileInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    alert('Por favor, selecciona un archivo de video válido.');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    alert('El archivo de video es demasiado grande. El límite es 50 MB.');
    return;
  }

  videoGalleryUploadNewBtn.disabled = true;
  const originalText = videoGalleryUploadNewBtn.innerHTML;
  videoGalleryUploadNewBtn.innerHTML = 'Subiendo...';

  try {
    const base64Data = await blobToBase64(file);
    const fileExt = file.name.split('.').pop() || 'mp4';
    const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { data, error } = await actions.uploadVideo({ base64Data, fileName });
    if (error || !data?.success || !data?.url) {
      throw new Error(error?.message || 'Error al subir el video.');
    }

    await loadGalleryVideos();
    const firstCard = videoGalleryGrid.firstElementChild as HTMLDivElement;
    if (firstCard) {
      firstCard.click();
    }
  } catch (err: any) {
    console.error("Video gallery upload error:", err);
    alert("Error al subir el video: " + (err.message || err.code));
  } finally {
    videoGalleryUploadNewBtn.disabled = false;
    videoGalleryUploadNewBtn.innerHTML = originalText;
    videoGalleryFileInput.value = "";
  }
});

// Hero Hybrid Carousel live previews & gallery select
const heroImage1Input = document.getElementById('settings-hero-image1') as HTMLInputElement;
const heroImage1Preview = document.getElementById('settings-hero-image1-preview') as HTMLDivElement;
heroImage1Input?.addEventListener('input', () => {
  const url = heroImage1Input.value.trim();
  if (url) {
    heroImage1Preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
  } else {
    heroImage1Preview.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
  }
});

const heroVideoInput = document.getElementById('settings-hero-video') as HTMLInputElement;
const heroVideoPreview = document.getElementById('settings-hero-video-preview') as HTMLDivElement;
heroVideoInput?.addEventListener('input', () => {
  const url = heroVideoInput.value.trim();
  if (url) {
    heroVideoPreview.innerHTML = `<video src="${url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
  } else {
    heroVideoPreview.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
  }
});

const heroImage3Input = document.getElementById('settings-hero-image3') as HTMLInputElement;
const heroImage3Preview = document.getElementById('settings-hero-image3-preview') as HTMLDivElement;
heroImage3Input?.addEventListener('input', () => {
  const url = heroImage3Input.value.trim();
  if (url) {
    heroImage3Preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
  } else {
    heroImage3Preview.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
  }
});

const heroImage2Input = document.getElementById('settings-hero-image2') as HTMLInputElement;
const heroImage2Preview = document.getElementById('settings-hero-image2-preview') as HTMLDivElement;
heroImage2Input?.addEventListener('input', () => {
  const url = heroImage2Input.value.trim();
  if (url) {
    heroImage2Preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
  } else {
    heroImage2Preview.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
  }
});

// Toggle visibility of Slide 2 media type containers
const slide2TypeSelect = document.getElementById('settings-hero-slide2-type') as HTMLSelectElement;
const slide2VideoContainer = document.getElementById('settings-slide2-video-container');
const slide2ImageContainer = document.getElementById('settings-slide2-image-container');

function updateSlide2Visibility() {
  if (!slide2TypeSelect) return;
  if (slide2TypeSelect.value === 'video') {
    slide2VideoContainer?.classList.remove('hidden');
    slide2ImageContainer?.classList.add('hidden');
  } else {
    slide2VideoContainer?.classList.add('hidden');
    slide2ImageContainer?.classList.remove('hidden');
  }
}

slide2TypeSelect?.addEventListener('change', updateSlide2Visibility);
// Run visibility check on load/init
if (slide2TypeSelect) {
  updateSlide2Visibility();
}

// Toggle visibility of Slide 3 media type containers
const slide3TypeSelect = document.getElementById('settings-hero-slide3-type') as HTMLSelectElement;
const slide3ImageContainer = document.getElementById('settings-slide3-image-container');
const slide3VideoContainer = document.getElementById('settings-slide3-video-container');

function updateSlide3Visibility() {
  if (!slide3TypeSelect) return;
  if (slide3TypeSelect.value === 'video') {
    slide3VideoContainer?.classList.remove('hidden');
    slide3ImageContainer?.classList.add('hidden');
  } else {
    slide3VideoContainer?.classList.add('hidden');
    slide3ImageContainer?.classList.remove('hidden');
  }
}

slide3TypeSelect?.addEventListener('change', updateSlide3Visibility);
if (slide3TypeSelect) {
  updateSlide3Visibility();
}

// Live preview for hero-video2 input (Slide 3 video)
const heroVideo2Input = document.getElementById('settings-hero-video2') as HTMLInputElement;
const heroVideo2Preview = document.getElementById('settings-hero-video2-preview') as HTMLDivElement;
heroVideo2Input?.addEventListener('input', () => {
  const url = heroVideo2Input.value.trim();
  if (url) {
    heroVideo2Preview.innerHTML = `<video src="${url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
  } else {
    heroVideo2Preview.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
  }
});

// Open video gallery for Slide 3 video input
const openVideo2GalleryBtn = document.getElementById('open-video2-gallery-btn') as HTMLButtonElement;
openVideo2GalleryBtn?.addEventListener('click', () => {
  // Re-wire video gallery to target the Slide 3 video input
  const originalInsertHandler = () => {
    if (state.videoGallery.selectedUrl) {
      if (heroVideo2Input) heroVideo2Input.value = state.videoGallery.selectedUrl;
      if (heroVideo2Preview) {
        heroVideo2Preview.innerHTML = `<video src="${state.videoGallery.selectedUrl}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
      }
      toggleVideoGalleryModal(false);
    }
  };
  // Temporarily override insert btn for slide 3 target
  const insertBtn = document.getElementById('insert-video-gallery-btn') as HTMLButtonElement;
  if (insertBtn) {
    const newInsert = insertBtn.cloneNode(true) as HTMLButtonElement;
    insertBtn.parentNode?.replaceChild(newInsert, insertBtn);
    newInsert.addEventListener('click', originalInsertHandler);
  }
  toggleVideoGalleryModal(true);
});

// Bind image and video gallery buttons in brand settings using event delegation
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.open-settings-gallery-btn');
  if (btn) {
    const inputId = btn.getAttribute('data-input') || '';
    const previewId = btn.getAttribute('data-preview') || '';
    const inputEl = document.getElementById(inputId) as HTMLInputElement;
    const previewEl = document.getElementById(previewId) as HTMLDivElement;
    if (inputEl && previewEl) {
      state.gallery.activeInput = inputEl;
      state.gallery.activePreview = previewEl;
      toggleGalleryModal(true);
    }
  }
});

document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.open-settings-video-gallery-btn');
  if (btn) {
    const inputId = btn.getAttribute('data-input') || '';
    const previewId = btn.getAttribute('data-preview') || '';
    const inputEl = document.getElementById(inputId) as HTMLInputElement;
    const previewEl = document.getElementById(previewId) as HTMLDivElement;
    if (inputEl && previewEl) {
      state.videoGallery.activeInput = inputEl;
      state.videoGallery.activePreview = previewEl;
      toggleVideoGalleryModal(true);
    }
  }
});

// --- 10. Variant Tree Editor Logic ---
function updateGeneralStockSum() {
  const stockInput = document.getElementById('form-stock') as HTMLInputElement;
  if (!stockInput) return;

  let totalStock = 0;
  const stockInputs = document.querySelectorAll('.color-branch .size-stock');
  stockInputs.forEach((input) => {
    const val = parseInt((input as HTMLInputElement).value) || 0;
    totalStock += val;
  });

  stockInput.value = totalStock.toString();
}

function createSizeRowHTML(_branchId: string, sizeData: any = {}) {
  const sizeName = sizeData.size || '';
  const sku = sizeData.sku || '';
  const price = sizeData.price || '';
  const stock = sizeData.stock !== undefined ? sizeData.stock : '10';
  const rowId = `row-${Math.random().toString(36).substring(2, 11)}`;

  return `
    <tr class="size-row border-b border-slate-150 last:border-b-0" id="${rowId}">
      <td class="py-2 pr-2">
        <input type="text" placeholder="Talla" value="${sizeName}" class="size-name w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-3xs focus:outline-none focus:border-rose-600 font-bold text-center uppercase" required />
      </td>
      <td class="py-2 px-2">
        <input type="text" placeholder="SKU" value="${sku}" class="size-sku w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-3xs font-mono focus:outline-none focus:border-rose-600" required />
      </td>
      <td class="py-2 px-2">
        <input type="number" step="0.01" placeholder="0.00" value="${price}" class="size-price w-full bg-white text-slate-950 border border-slate-200 rounded-lg px-2 py-1 text-3xs focus:outline-none focus:border-rose-600 font-mono text-right" required />
      </td>
      <td class="py-2 px-2">
        <input type="number" placeholder="10" value="${stock}" class="size-stock w-full bg-white text-slate-950 border border-slate-200 rounded-lg px-2 py-1 text-3xs focus:outline-none focus:border-rose-600 font-mono text-right" required />
      </td>
      <td class="py-2 pl-2 text-center">
        <button type="button" class="remove-size-row-btn text-rose-500 hover:text-rose-600 font-bold px-1.5 text-sm" title="Quitar Talla">×</button>
      </td>
    </tr>
  `;
}

function addColorBranch(colorName = '', colorHex = '#e11d48', imageUrl = '', sizes: any[] = []) {
  state.branchIndex++;
  const branchId = `branch-${state.branchIndex}`;
  
  const card = document.createElement('div');
  card.className = 'color-branch border border-slate-200 bg-white p-4 rounded-2xl flex flex-col gap-3 relative shadow-2xs';
  card.id = branchId;
  
  card.innerHTML = `
    <div class="flex justify-between items-center gap-3 border-b border-slate-100 pb-2">
      <div class="flex items-center gap-2 flex-1">
        <span class="text-3xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Color/Estilo:</span>
        <input type="text" value="${colorName}" placeholder="Ej: negro, rosa..." class="color-name bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-rose-600 font-bold flex-1" required />
        <input type="color" value="${colorHex}" class="color-hex w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0 shrink-0 bg-transparent" title="Selecciona color exacto" />
      </div>
      <button type="button" class="remove-branch-btn text-rose-500 hover:text-rose-650 text-3xs font-extrabold uppercase tracking-wider">Eliminar Color</button>
    </div>

    <div class="grid grid-cols-12 gap-3 items-center">
      <div class="col-span-9 flex flex-col gap-1">
        <span class="text-3xs font-bold text-slate-400 uppercase tracking-wider">Imagen de Variante</span>
        <div class="flex gap-2">
          <input type="text" value="${imageUrl}" placeholder="https://..." class="color-image flex-grow bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 text-3xs font-mono focus:outline-none focus:border-rose-600" />
          <button type="button" class="open-gallery-btn px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold uppercase transition-colors shrink-0 flex items-center gap-1">
            Galería
          </button>
          <button type="button" class="upload-variant-img-btn px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold uppercase transition-colors shrink-0 flex items-center gap-1">
            Subir
          </button>
          <input type="file" class="variant-img-file hidden" accept="image/*" />
        </div>
      </div>
      <div class="col-span-3 flex justify-end">
        <div class="variant-img-preview w-12 h-16 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center text-[8px] text-slate-400 shrink-0 shadow-3xs">
          ${imageUrl ? `<img src="${imageUrl}" class="w-full h-full object-cover" />` : 'Sin img'}
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2 mt-1">
      <div class="flex justify-between items-center border-t border-slate-200 pt-2.5 mb-1">
        <span class="text-3xs font-bold text-slate-400 uppercase tracking-widest">Tallas & Inventario</span>
        <button type="button" class="add-size-row-btn text-rose-600 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5">
          + Añadir Talla
        </button>
      </div>
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400 text-[9px] font-extrabold uppercase tracking-wider">
              <th class="py-1.5 pr-2 w-16">Talla</th>
              <th class="py-1.5 px-2">SKU</th>
              <th class="py-1.5 px-2 w-20 text-right">Precio ($)</th>
              <th class="py-1.5 px-2 w-16 text-right">Stock</th>
              <th class="py-1.5 pl-2 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody class="sizes-container divide-y divide-slate-100">
          </tbody>
        </table>
      </div>
    </div>
  `;

  variantTreeContainer.appendChild(card);

  const imgInput = card.querySelector('.color-image') as HTMLInputElement;
  const previewDiv = card.querySelector('.variant-img-preview') as HTMLDivElement;
  
  const colorNameInput = card.querySelector('.color-name') as HTMLInputElement;
  const colorHexInput = card.querySelector('.color-hex') as HTMLInputElement;
  colorNameInput.addEventListener('input', () => {
    const guessedHex = getColorHex(colorNameInput.value);
    if (guessedHex && guessedHex !== '#64748b') {
      colorHexInput.value = guessedHex;
    }
    updateSKUsForBranch(card);
  });
  imgInput.addEventListener('input', () => {
    const url = imgInput.value.trim();
    if (url) {
      previewDiv.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
    } else {
      previewDiv.innerHTML = 'Sin img';
    }
  });

  const variantGalleryBtn = card.querySelector('.open-gallery-btn') as HTMLButtonElement;
  variantGalleryBtn?.addEventListener('click', () => {
    openGallery(imgInput, previewDiv);
  });

  const uploadBtn = card.querySelector('.upload-variant-img-btn') as HTMLButtonElement;
  const fileInput = card.querySelector('.variant-img-file') as HTMLInputElement;
  
  uploadBtn?.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    uploadBtn.disabled = true;
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = 'Subiendo...';

    try {
      const downloadUrl = await handleImageUpload(file, 'variant');
      imgInput.value = downloadUrl;
      previewDiv.innerHTML = `<img src="${downloadUrl}" class="w-full h-full object-cover" />`;
    } catch (err) {
      console.error('Error uploading variant image:', err);
      alert('Error al subir la imagen.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalText;
    }
  });

  card.querySelector('.remove-branch-btn')?.addEventListener('click', () => {
    card.remove();
    updateGeneralStockSum();
  });

  function setupSizeRow(rowEl: HTMLTableRowElement) {
    rowEl.querySelector('.size-stock')?.addEventListener('input', updateGeneralStockSum);
    
    const sizeNameInput = rowEl.querySelector('.size-name') as HTMLInputElement;
    sizeNameInput?.addEventListener('input', () => {
      updateSKUsForBranch(card);
    });
    
    rowEl.querySelector('.remove-size-row-btn')?.addEventListener('click', () => {
      rowEl.remove();
      updateGeneralStockSum();
    });
  }

  const sizesContainer = card.querySelector('.sizes-container') as HTMLTableSectionElement;
  const addSizeRowBtn = card.querySelector('.add-size-row-btn') as HTMLButtonElement;
  addSizeRowBtn.addEventListener('click', () => {
    const tempTbody = document.createElement('tbody');
    tempTbody.innerHTML = createSizeRowHTML(branchId);
    const sizeRowEl = tempTbody.firstElementChild as HTMLTableRowElement;
    sizesContainer.appendChild(sizeRowEl);
    
    setupSizeRow(sizeRowEl);
    updateSKUsForBranch(card);
    updateGeneralStockSum();
  });

  if (sizes.length > 0) {
    sizes.forEach((s) => {
      const tempTbody = document.createElement('tbody');
      tempTbody.innerHTML = createSizeRowHTML(branchId, s);
      const sizeRowEl = tempTbody.firstElementChild as HTMLTableRowElement;
      sizesContainer.appendChild(sizeRowEl);
      setupSizeRow(sizeRowEl);
    });
  } else {
    const tempTbody = document.createElement('tbody');
    tempTbody.innerHTML = createSizeRowHTML(branchId, { size: 's' });
    const sizeRowEl = tempTbody.firstElementChild as HTMLTableRowElement;
    sizesContainer.appendChild(sizeRowEl);
    setupSizeRow(sizeRowEl);
    updateSKUsForBranch(card);
  }
}

addColorBranchBtn?.addEventListener('click', () => {
  addColorBranch();
  updateGeneralStockSum();
});

// --- 11. Edit Product click handler ---
document.querySelectorAll('.edit-product-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const productData = JSON.parse(target.dataset.product || '{}');

    modalTitle.textContent = "Editar Producto";
    (document.getElementById('form-product-id') as HTMLInputElement).value = productData.id;
    
    state.product.translations = {
      title: productData.title || '',
      description: productData.description || '',
      title_en: productData.title_en || '',
      description_en: productData.description_en || '',
    };
    state.product.activeLang = 'es';
    if (productLangSelect) productLangSelect.value = 'es';
    syncProductStateToForm('es');

    (document.getElementById('form-slug') as HTMLInputElement).value = productData.slug;
    (document.getElementById('form-price') as HTMLInputElement).value = (productData.price / 100).toString();
    (document.getElementById('form-stock') as HTMLInputElement).value = productData.stock.toString();
    
    state.product.images = productData.images ? [...productData.images] : [];
    renderProductMedia();

    variantTreeContainer.innerHTML = '';
    if (productData.variants && productData.variants.length > 0) {
      const tree: Record<string, { image: string, colorHex: string, sizes: any[] }> = {};
      
      productData.variants.forEach((v: any) => {
        const parts = v.name.split('/').map((p: any) => p.trim());
        const color = parts[0] || 'Base';
        const size = parts[1] || '';
        
        if (!tree[color]) {
          tree[color] = {
            image: v.image || '',
            colorHex: v.colorHex || getColorHex(color),
            sizes: []
          };
        }
        
        tree[color].sizes.push({
          size: size,
          sku: v.sku,
          price: (v.price / 100).toString(),
          stock: v.stock
        });
      });

      Object.keys(tree).forEach((colorName) => {
        const branch = tree[colorName];
        addColorBranch(colorName, branch.colorHex, branch.image, branch.sizes);
      });
    } else {
      addColorBranch('negro', '#0f172a', '', []);
    }
    
    updateGeneralStockSum();
    renderProductCollections(productData.id);
    toggleModal(productModal, true);
  });
});

// --- 12. Submit Product Form Action ---
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveProductBtn.disabled = true;
  const originalBtnText = saveProductBtn.innerHTML;
  saveProductBtn.innerHTML = "<span>Guardando...</span>";

  // Validate that the product has a gender category selected
  const genderRadio = document.querySelector('input[name="product-gender-assoc"]:checked') as HTMLInputElement;
  const genderVal = genderRadio ? genderRadio.value : '';

  if (!genderVal) {
    showToast("Error: Debe elegir obligatoriamente a qué género va dirigido el producto (Hombre, Mujer o Unisex).", "error");
    saveProductBtn.disabled = false;
    saveProductBtn.innerHTML = originalBtnText;
    return;
  }

  const idVal = (document.getElementById('form-product-id') as HTMLInputElement).value;
  const slugVal = (document.getElementById('form-slug') as HTMLInputElement).value;
  const priceVal = parseFloat((document.getElementById('form-price') as HTMLInputElement).value);
  const stockVal = parseInt((document.getElementById('form-stock') as HTMLInputElement).value);

  syncProductFormToState(state.product.activeLang);

  const variantsVal: any[] = [];
  const productBranches = document.querySelectorAll('.color-branch');
  
  productBranches.forEach((branch) => {
    const colorName = (branch.querySelector('.color-name') as HTMLInputElement).value.trim();
    const colorHex = (branch.querySelector('.color-hex') as HTMLInputElement).value;
    const colorImage = (branch.querySelector('.color-image') as HTMLInputElement).value.trim();
    const sizeRows = branch.querySelectorAll('.size-row');
    
    sizeRows.forEach((row) => {
      const sizeName = (row.querySelector('.size-name') as HTMLInputElement).value.trim();
      const sku = (row.querySelector('.size-sku') as HTMLInputElement).value.trim();
      const price = parseFloat((row.querySelector('.size-price') as HTMLInputElement).value);
      const stock = parseInt((row.querySelector('.size-stock') as HTMLInputElement).value);
      
      variantsVal.push({
        sku: sku,
        name: sizeName ? `${colorName} / ${sizeName}` : colorName,
        price: Math.round(price * 100),
        stock: stock,
        image: colorImage || null,
        colorHex: colorHex || null
      });
    });
  });

  const imagesVal = [...state.product.images];
  if (imagesVal.length === 0) {
    imagesVal.push('/images/placeholder.jpg');
  }

  const productPayload: any = {
    title: state.product.translations.title,
    title_en: state.product.translations.title_en || undefined,
    slug: slugVal,
    description: state.product.translations.description,
    description_en: state.product.translations.description_en || undefined,
    price: Math.round(priceVal * 100),
    stock: stockVal,
    images: imagesVal,
    variants: variantsVal,
    seo: {
      title: `${state.product.translations.title} | FLEX FORM FITNESS`,
      description: state.product.translations.description.substring(0, 150),
      keywords: ['fitness', 'ropa', 'activewear'],
    },
  };

  if (state.product.translations.title_en) {
    productPayload.seo_en = {
      title: `${state.product.translations.title_en} | FLEX FORM FITNESS`,
      description: state.product.translations.description_en ? state.product.translations.description_en.substring(0, 150) : '',
      keywords: ['fitness', 'ropa', 'activewear'],
    };
  }

  try {
    let targetProductId = idVal;
    if (idVal) {
      const { error } = await actions.updateProduct({ id: idVal, ...productPayload });
      if (error) throw error;
      localStorage.setItem('flexform_pending_changes', 'true');
    } else {
      const { data, error } = await actions.createProduct(productPayload);
      if (error) throw error;
      if (data?.productId) {
        targetProductId = data.productId;
      }
      localStorage.setItem('flexform_pending_changes', 'true');
    }

    if (targetProductId) {
      const checkedCollectionIds = Array.from(document.querySelectorAll('input[name="product-col-assoc"]:checked'))
        .map((el) => (el as HTMLInputElement).value);

      const dbCollections = getDbCollections() || [];
      const menCol = dbCollections.find((c: any) => c.slug === 'hombre');
      const womenCol = dbCollections.find((c: any) => c.slug === 'mujer');
      
      const genderRadio = document.querySelector('input[name="product-gender-assoc"]:checked') as HTMLInputElement;
      const genderVal = genderRadio ? genderRadio.value : '';

      if (genderVal === 'hombre' && menCol) {
        checkedCollectionIds.push(menCol.id);
      } else if (genderVal === 'mujer' && womenCol) {
        checkedCollectionIds.push(womenCol.id);
      } else if (genderVal === 'unisex') {
        if (menCol) checkedCollectionIds.push(menCol.id);
        if (womenCol) checkedCollectionIds.push(womenCol.id);
      }

      const initialCollectionIds = dbCollections
        .filter((col: any) => (col.productIds || []).includes(targetProductId))
        .map((col: any) => col.id);

      const collectionsToAdd = checkedCollectionIds.filter((id: string) => !initialCollectionIds.includes(id));
      const collectionsToRemove = initialCollectionIds.filter((id: string) => !checkedCollectionIds.includes(id));

      const updatePromises = [];

      for (const colId of collectionsToAdd) {
        const col = dbCollections.find((c: any) => c.id === colId);
        if (col) {
          const newProductIds = [...(col.productIds || []), targetProductId];
          updatePromises.push(
            actions.updateCollection({
              id: col.id,
              title: col.title,
              slug: col.slug,
              description: col.description,
              detailedDescription: col.detailedDescription || null,
              productIds: newProductIds,
              seo: col.seo
            })
          );
        }
      }

      for (const colId of collectionsToRemove) {
        const col = dbCollections.find((c: any) => c.id === colId);
        if (col) {
          const newProductIds = (col.productIds || []).filter((pid: string) => pid !== targetProductId);
          updatePromises.push(
            actions.updateCollection({
              id: col.id,
              title: col.title,
              slug: col.slug,
              description: col.description,
              detailedDescription: col.detailedDescription || null,
              productIds: newProductIds,
              seo: col.seo
            })
          );
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }

    alert("Producto guardado con éxito.");
    window.location.reload();
  } catch (err: any) {
    console.error("Save product action error:", err);
    alert("Error al guardar producto: " + (err.message || err.code));
    saveProductBtn.disabled = false;
    saveProductBtn.innerHTML = originalBtnText;
  }
});

// Delete Product Action
document.querySelectorAll('.delete-product-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const productId = target.dataset.productId || '';
    const productTitle = target.dataset.productTitle || '';

    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${productTitle}"? Esta acción no se puede deshacer.`)) {
      target.disabled = true;
      const originalContent = target.textContent;
      target.textContent = "Eliminando...";
      
      try {
        const { error } = await actions.deleteProduct({ id: productId });
        if (error) throw error;
        localStorage.setItem('flexform_pending_changes', 'true');
        alert("Producto eliminado con éxito.");
        window.location.reload();
      } catch (err: any) {
        console.error("Delete product error:", err);
        alert("Error al eliminar producto: " + (err.message || err.code));
        target.disabled = false;
        target.textContent = originalContent;
      }
    }
  });
});

// Search Products client filtering
searchProductsInput?.addEventListener('input', () => {
  const query = searchProductsInput.value.toLowerCase().trim();
  document.querySelectorAll('.product-row').forEach((row) => {
    const title = row.getAttribute('data-title') || '';
    const slug = row.getAttribute('data-slug') || '';
    if (title.includes(query) || slug.includes(query)) {
      (row as HTMLElement).classList.remove('hidden');
    } else {
      (row as HTMLElement).classList.add('hidden');
    }
  });
});

// --- 13. Folders and Desktop Catalog reordering ---
const allProducts = Array.from(document.querySelectorAll('.product-draggable')).map((el) => {
  const htmlEl = el as HTMLDivElement;
  return {
    id: htmlEl.dataset.id || '',
    title: htmlEl.dataset.title || '',
    image: htmlEl.dataset.image || '',
    sku: htmlEl.dataset.sku || '',
    gender: htmlEl.dataset.gender || ''
  };
});

function switchCollectionTab(tab: 'info' | 'products') {
  if (tab === 'info') {
    collTabInfo?.classList.add('border-rose-600', 'text-rose-600');
    collTabInfo?.classList.remove('border-transparent', 'text-slate-400');
    collTabProducts?.classList.add('border-transparent', 'text-slate-400');
    collTabProducts?.classList.remove('border-rose-600', 'text-rose-600');

    collSecInfo?.classList.remove('hidden');
    collSecProducts?.classList.add('hidden');
  } else {
    collTabProducts?.classList.add('border-rose-600', 'text-rose-600');
    collTabProducts?.classList.remove('border-transparent', 'text-slate-400');
    collTabInfo?.classList.add('border-transparent', 'text-slate-400');
    collTabInfo?.classList.remove('border-rose-600', 'text-rose-600');

    collSecProducts?.classList.remove('hidden');
    collSecInfo?.classList.add('hidden');
  }
}

collTabInfo?.addEventListener('click', () => switchCollectionTab('info'));
collTabProducts?.addEventListener('click', () => switchCollectionTab('products'));

function getDragAfterElement(container: HTMLElement, y: number) {
  const draggableElements = Array.from(container.querySelectorAll('[draggable="true"]:not(.opacity-40)'));
  
  return draggableElements.reduce((closest: { offset: number; element: Element | null }, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

export function populateFolderProducts(associatedIds: string[]) {
  const currentListEl = document.getElementById('coll-current-list');
  const availableListEl = document.getElementById('coll-available-list');
  const currentCountEl = document.getElementById('coll-current-count');
  
  if (!currentListEl || !availableListEl) return;
  
  currentListEl.innerHTML = '';
  availableListEl.innerHTML = '';
  
  const count = associatedIds.length;
  if (currentCountEl) {
    currentCountEl.textContent = `${count} ${count === 1 ? 'producto asociado' : 'productos asociados'} (Arrastra para ordenar)`;
  }

  const searchQuery = collCatalogSearch?.value.toLowerCase().trim() || '';

  const getProductMeta = (id: string) => {
    return allProducts.find((p) => p.id === id);
  };

  associatedIds.forEach((id, index) => {
    const p = getProductMeta(id);
    if (!p) return;

    const item = document.createElement('div');
    item.className = 'flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-355 shadow-3xs cursor-grab active:cursor-grabbing transition-all select-none';
    item.draggable = true;
    item.dataset.id = p.id;
    item.dataset.index = String(index);

    item.innerHTML = `
      <div class="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-mono text-[9px] font-bold shrink-0 border border-slate-200">
        ${index + 1}
      </div>
      <div class="w-14 h-18 rounded overflow-hidden bg-slate-50 shrink-0 border border-slate-200">
        <img src="${p.image}" class="w-full h-full object-cover" />
      </div>
      <div class="min-w-0 flex-grow text-left">
        <div class="flex items-center flex-wrap gap-1.5 mb-0.5">
          <span class="block text-[8px] font-extrabold text-slate-400 uppercase font-mono leading-none">SKU: ${p.sku}</span>
          <span class="px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider border ${
            p.gender === 'hombre' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            p.gender === 'mujer' ? 'bg-pink-50 text-pink-600 border-pink-100' :
            p.gender === 'unisex' ? 'bg-purple-50 text-purple-600 border-purple-100' :
            'bg-slate-100 text-slate-500 border-slate-200'
          }">
            ${p.gender === 'hombre' ? 'Hombre' : p.gender === 'mujer' ? 'Mujer' : p.gender === 'unisex' ? 'Unisex' : 'Sin género'}
          </span>
        </div>
        <span class="block text-xs font-bold text-slate-900 truncate leading-tight">${p.title}</span>
      </div>
      <button 
        type="button" 
        class="remove-assoc-btn text-2xs font-extrabold uppercase px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 text-slate-500 transition-all active:scale-95 shrink-0"
      >
        Quitar
      </button>
    `;

    item.querySelector('.remove-assoc-btn')?.addEventListener('click', () => {
      associatedIds.splice(index, 1);
      showToast(`"${p.title}" removido de la colección.`);
      populateFolderProducts(associatedIds);
    });

    item.addEventListener('dragstart', (e) => {
      const dragEvent = e as DragEvent;
      dragEvent.dataTransfer?.setData('text/plain', p.id);
      dragEvent.dataTransfer?.setData('source-index', String(index));
      item.classList.add('opacity-40');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('opacity-40');
    });

    currentListEl.appendChild(item);
  });

  const availableProducts = allProducts.filter((p) => !associatedIds.includes(p.id));
  const filteredAvailable = availableProducts.filter((p) => {
    return p.title.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery);
  });

  if (filteredAvailable.length === 0) {
    availableListEl.innerHTML = `
      <div class="py-8 flex flex-col items-center justify-center text-center text-slate-400 gap-1 border border-dashed border-slate-200 rounded-xl bg-slate-50 p-4">
        <span class="text-3xs uppercase tracking-wider font-extrabold text-slate-400">Sin resultados</span>
        <span class="text-[9px]">No hay más productos disponibles para añadir.</span>
      </div>
    `;
  } else {
    filteredAvailable.forEach((p) => {
      const item = document.createElement('div');
      item.className = 'flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white transition-all select-none cursor-grab active:cursor-grabbing';
      item.draggable = true;
      item.dataset.id = p.id;

      item.innerHTML = `
        <div class="w-14 h-18 rounded overflow-hidden bg-slate-50 shrink-0 border border-slate-200">
          <img src="${p.image}" class="w-full h-full object-cover" />
        </div>
        <div class="min-w-0 flex-grow text-left">
          <div class="flex items-center flex-wrap gap-1.5 mb-0.5">
            <span class="block text-[8px] font-extrabold text-slate-400 uppercase font-mono leading-none">SKU: ${p.sku}</span>
            <span class="px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider border ${
              p.gender === 'hombre' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              p.gender === 'mujer' ? 'bg-pink-50 text-pink-600 border-pink-100' :
              p.gender === 'unisex' ? 'bg-purple-50 text-purple-600 border-purple-100' :
              'bg-slate-100 text-slate-500 border-slate-200'
            }">
              ${p.gender === 'hombre' ? 'Hombre' : p.gender === 'mujer' ? 'Mujer' : p.gender === 'unisex' ? 'Unisex' : 'Sin género'}
            </span>
          </div>
          <span class="block text-xs font-bold text-slate-900 truncate leading-tight">${p.title}</span>
        </div>
        <button 
          type="button" 
          class="add-assoc-btn text-2xs font-extrabold uppercase px-2.5 py-1.5 rounded-lg border border-rose-600 bg-rose-600 hover:bg-red-700 text-white shadow-3xs transition-all active:scale-95 shrink-0"
        >
          Añadir
        </button>
      `;

      item.querySelector('.add-assoc-btn')?.addEventListener('click', () => {
        associatedIds.push(p.id);
        showToast(`"${p.title}" añadido.`);
        populateFolderProducts(associatedIds);
      });

      item.addEventListener('dragstart', (e) => {
        const dragEvent = e as DragEvent;
        dragEvent.dataTransfer?.setData('text/plain', p.id);
        dragEvent.dataTransfer?.setData('source-index', '');
        item.classList.add('opacity-40');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('opacity-40');
      });

      availableListEl.appendChild(item);
    });
  }
}

collCatalogSearch?.addEventListener('input', () => {
  populateFolderProducts(state.collection.currentOpenedFolderIds);
});

collCurrentList?.addEventListener('dragover', (e) => {
  e.preventDefault();
  const draggingEl = collCurrentList.querySelector('.opacity-40') as HTMLElement;
  if (!draggingEl) return;

  const afterElement = getDragAfterElement(collCurrentList, e.clientY);
  if (afterElement == null) {
    collCurrentList.appendChild(draggingEl);
  } else {
    collCurrentList.insertBefore(draggingEl, afterElement);
  }
});

collCurrentList?.addEventListener('drop', (e) => {
  e.preventDefault();
  
  const dragEvent = e as DragEvent;
  const productId = dragEvent.dataTransfer?.getData('text/plain');
  const sourceIndexStr = dragEvent.dataTransfer?.getData('source-index');

  if (!productId) return;

  if (!state.collection.currentOpenedFolderIds.includes(productId)) {
    const afterElement = getDragAfterElement(collCurrentList, dragEvent.clientY) as HTMLElement | null;
    if (afterElement) {
      const targetIndex = parseInt(afterElement.dataset.index || '0');
      state.collection.currentOpenedFolderIds.splice(targetIndex, 0, productId);
    } else {
      state.collection.currentOpenedFolderIds.push(productId);
    }
    showToast("Producto añadido a la colección.");
  } else if (sourceIndexStr !== undefined && sourceIndexStr !== '') {
    const sourceIndex = parseInt(sourceIndexStr);
    const afterElement = getDragAfterElement(collCurrentList, dragEvent.clientY) as HTMLElement | null;
    
    const item = state.collection.currentOpenedFolderIds.splice(sourceIndex, 1)[0];
    
    if (afterElement) {
      let targetIndex = parseInt(afterElement.dataset.index || '0');
      if (targetIndex > sourceIndex) {
        targetIndex -= 1;
      }
      state.collection.currentOpenedFolderIds.splice(targetIndex, 0, item);
    } else {
      state.collection.currentOpenedFolderIds.push(item);
    }
    showToast("Orden de catálogo actualizado.");
  }

  populateFolderProducts(state.collection.currentOpenedFolderIds);
});

// --- 14. Create / Edit Collection logic ---
openNewCollectionModal?.addEventListener('click', () => {
  collectionForm.reset();
  state.collection.activeLang = 'es';
  if (collectionLangSelect) collectionLangSelect.value = 'es';
  state.collection.translations = {
    title: '', description: '', detailedDescription: '', seo_title: '', seo_keywords: '', seo_desc: '',
    title_en: '', description_en: '', detailedDescription_en: '', seo_title_en: '', seo_keywords_en: '', seo_desc_en: '',
  };
  collectionModalTitle.textContent = "Nueva Carpeta de Colección";
  (document.getElementById('form-collection-id') as HTMLInputElement).value = "";
  const showOnIndexCheckbox = document.getElementById('form-collection-show-on-index') as HTMLInputElement;
  if (showOnIndexCheckbox) showOnIndexCheckbox.checked = false;
  const indexOrderInput = document.getElementById('form-collection-index-order') as HTMLInputElement;
  if (indexOrderInput) indexOrderInput.value = "0";
  deleteCurrentCollectionBtn?.classList.add('hidden');
  if (collCatalogSearch) collCatalogSearch.value = "";
  
  switchCollectionTab('info');
  state.collection.currentOpenedFolderIds = [];
  populateFolderProducts(state.collection.currentOpenedFolderIds);

  updateVisualFromTextarea('iframe-col-desc', 'form-collection-desc');
  updateVisualFromTextarea('iframe-col-det', 'form-collection-detailed-desc');

  toggleModal(collectionModal, true);
});

closeCollectionModal?.addEventListener('click', () => toggleModal(collectionModal, false));
cancelCollectionModal?.addEventListener('click', () => toggleModal(collectionModal, false));

const collectionTitleInput = document.getElementById('form-collection-title') as HTMLInputElement;
const collectionSlugInput = document.getElementById('form-collection-slug') as HTMLInputElement;
collectionTitleInput?.addEventListener('input', () => {
  const idVal = (document.getElementById('form-collection-id') as HTMLInputElement).value;
  if (!idVal && state.collection.activeLang === 'es') {
    collectionSlugInput.value = collectionTitleInput.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

collectionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveCollectionBtn.disabled = true;
  const originalBtnText = saveCollectionBtn.innerHTML;
  saveCollectionBtn.innerHTML = "<span>Guardando...</span>";

  const idVal = (document.getElementById('form-collection-id') as HTMLInputElement).value;
  const slugVal = (document.getElementById('form-collection-slug') as HTMLInputElement).value.trim();

  syncCollectionFormToState(state.collection.activeLang);

  const showOnIndexCheckbox = document.getElementById('form-collection-show-on-index') as HTMLInputElement;
  const showOnIndex = showOnIndexCheckbox ? showOnIndexCheckbox.checked : false;
  const indexOrderInput = document.getElementById('form-collection-index-order') as HTMLInputElement;
  const indexOrder = indexOrderInput ? parseInt(indexOrderInput.value) || 0 : 0;

  const collectionPayload: any = {
    title: state.collection.translations.title,
    title_en: state.collection.translations.title_en || undefined,
    slug: slugVal,
    description: state.collection.translations.description,
    description_en: state.collection.translations.description_en || undefined,
    detailedDescription: state.collection.translations.detailedDescription || null,
    detailedDescription_en: state.collection.translations.detailedDescription_en || null,
    productIds: state.collection.currentOpenedFolderIds,
    showOnIndex,
    indexOrder,
    seo: {
      title: state.collection.translations.seo_title || state.collection.translations.title,
      description: state.collection.translations.seo_desc || state.collection.translations.description,
      keywords: state.collection.translations.seo_keywords ? state.collection.translations.seo_keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
    },
  };

  if (state.collection.translations.title_en) {
    collectionPayload.seo_en = {
      title: state.collection.translations.seo_title_en || state.collection.translations.title_en,
      description: state.collection.translations.seo_desc_en || state.collection.translations.description_en || '',
      keywords: state.collection.translations.seo_keywords_en ? state.collection.translations.seo_keywords_en.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
    };
  }

  try {
    if (idVal) {
      const { error } = await actions.updateCollection({ id: idVal, ...collectionPayload });
      if (error) throw error;
      localStorage.setItem('flexform_pending_changes', 'true');
      showToast("Carpeta actualizada con éxito.");
    } else {
      const { error } = await actions.createCollection(collectionPayload);
      if (error) throw error;
      localStorage.setItem('flexform_pending_changes', 'true');
      showToast("Carpeta creada con éxito.");
    }
    window.location.reload();
  } catch (err: any) {
    console.error("Save collection error:", err);
    showToast("Error al guardar carpeta de colección: " + (err.message || err.code), "error");
    saveCollectionBtn.disabled = false;
    saveCollectionBtn.innerHTML = originalBtnText;
  }
});

// Edit Collection via Folder double click
document.querySelectorAll('.collection-folder').forEach((folder) => {
  folder.addEventListener('click', () => {
    const htmlEl = folder as HTMLDivElement;
    const colData = JSON.parse(htmlEl.dataset.collectionJson || '{}');

    collectionModalTitle.textContent = "Propiedades: Carpeta " + colData.title;
    (document.getElementById('form-collection-id') as HTMLInputElement).value = colData.id;
    (document.getElementById('form-collection-slug') as HTMLInputElement).value = colData.slug;
    const showOnIndexCheckbox = document.getElementById('form-collection-show-on-index') as HTMLInputElement;
    if (showOnIndexCheckbox) showOnIndexCheckbox.checked = !!colData.showOnIndex;
    const indexOrderInput = document.getElementById('form-collection-index-order') as HTMLInputElement;
    if (indexOrderInput) indexOrderInput.value = colData.indexOrder !== undefined ? String(colData.indexOrder) : "0";

    state.collection.translations = {
      title: colData.title || '',
      description: colData.description || '',
      detailedDescription: colData.detailedDescription || '',
      seo_title: colData.seo?.title || '',
      seo_keywords: colData.seo?.keywords?.join(', ') || '',
      seo_desc: colData.seo?.description || '',
      
      title_en: colData.title_en || '',
      description_en: colData.description_en || '',
      detailedDescription_en: colData.detailedDescription_en || '',
      seo_title_en: colData.seo_en?.title || '',
      seo_keywords_en: colData.seo_en?.keywords?.join(', ') || '',
      seo_desc_en: colData.seo_en?.description || '',
    };
    state.collection.activeLang = 'es';
    if (collectionLangSelect) collectionLangSelect.value = 'es';
    syncCollectionStateToForm('es');

    if (deleteCurrentCollectionBtn) {
      if (colData.slug === 'hombre' || colData.slug === 'mujer') {
        deleteCurrentCollectionBtn.classList.add('hidden');
      } else {
        deleteCurrentCollectionBtn.classList.remove('hidden');
      }
      deleteCurrentCollectionBtn.dataset.collectionId = colData.id;
      deleteCurrentCollectionBtn.dataset.collectionTitle = colData.title;
    }

    const slugInput = document.getElementById('form-collection-slug') as HTMLInputElement;
    if (slugInput) {
      if (colData.slug === 'hombre' || colData.slug === 'mujer') {
        slugInput.readOnly = true;
        slugInput.classList.add('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
      } else {
        slugInput.readOnly = false;
        slugInput.classList.remove('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
      }
    }

    if (collTabProducts) {
      if (colData.slug === 'hombre' || colData.slug === 'mujer') {
        collTabProducts.classList.add('hidden');
      } else {
        collTabProducts.classList.remove('hidden');
      }
    }

    switchCollectionTab('info');
    state.collection.currentOpenedFolderIds = [...(colData.productIds || [])];
    populateFolderProducts(state.collection.currentOpenedFolderIds);

    toggleModal(collectionModal, true);
  });
});

deleteCurrentCollectionBtn?.addEventListener('click', async () => {
  const collectionId = deleteCurrentCollectionBtn.dataset.collectionId || '';
  const collectionTitle = deleteCurrentCollectionBtn.dataset.collectionTitle || '';
  if (!collectionId) return;

  if (confirm(`¿Estás seguro de que deseas eliminar la carpeta "${collectionTitle}"? Los productos vinculados no se eliminarán del catálogo.`)) {
    deleteCurrentCollectionBtn.disabled = true;
    deleteCurrentCollectionBtn.textContent = "Eliminando...";
    
    try {
      const { error } = await actions.deleteCollection({ id: collectionId });
      if (error) throw error;
      localStorage.setItem('flexform_pending_changes', 'true');
      showToast("Carpeta eliminada.");
      window.location.reload();
    } catch (err: any) {
      console.error("Delete collection error:", err);
      showToast("Error al eliminar carpeta: " + (err.message || err.code), "error");
      deleteCurrentCollectionBtn.disabled = false;
      deleteCurrentCollectionBtn.textContent = "Eliminar Carpeta";
    }
  }
});

// Dragging catalog products to folders on Desktop
document.querySelectorAll('.product-draggable').forEach((card) => {
  card.addEventListener('dragstart', (e) => {
    const dragEvent = e as DragEvent;
    dragEvent.dataTransfer?.setData('text/plain', card.getAttribute('data-id') || '');
    card.classList.add('opacity-40');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('opacity-40');
  });
});

document.querySelectorAll('.collection-folder').forEach((folder) => {
  folder.addEventListener('dragover', (e) => {
    e.preventDefault();
    folder.classList.add('bg-amber-500/20', 'scale-105');
  });
  
  folder.addEventListener('dragleave', () => {
    folder.classList.remove('bg-amber-500/20', 'scale-105');
  });
  
  folder.addEventListener('drop', async (e) => {
    e.preventDefault();
    folder.classList.remove('bg-amber-500/20', 'scale-105');
    
    const dragEvent = e as DragEvent;
    const productId = dragEvent.dataTransfer?.getData('text/plain');
    const collectionId = folder.getAttribute('data-id');
    const colData = JSON.parse(folder.getAttribute('data-collection-json') || '{}');
    
    if (!productId || !collectionId) return;
    
    if (colData.slug === 'hombre' || colData.slug === 'mujer') {
      showToast("Las carpetas Hombre/Mujer son automáticas. Edita el género del producto para asociarlo.", "error");
      return;
    }
    
    const currentIds = colData.productIds || [];
    if (currentIds.includes(productId)) {
      showToast("Este producto ya está en esta carpeta", "error");
      return;
    }
    
    const newIds = [...currentIds, productId];
    
    const countBadge = folder.querySelector('.font-mono');
    if (countBadge) {
      countBadge.textContent = String(newIds.length);
    }
    
    colData.productIds = newIds;
    folder.setAttribute('data-collection-json', JSON.stringify(colData));
    
    try {
      const { error } = await actions.updateCollection({
        id: collectionId,
        title: colData.title,
        slug: colData.slug,
        description: colData.description,
        detailedDescription: colData.detailedDescription || null,
        productIds: newIds,
        seo: colData.seo || { title: colData.title, description: colData.description, keywords: [] }
      });
      
      if (error) throw error;
      localStorage.setItem('flexform_pending_changes', 'true');
      
      // Notify navigation to update state in memory or publish btn
      const pubBtn = document.getElementById('publish-changes-btn') as HTMLButtonElement;
      if (pubBtn) {
        pubBtn.disabled = false;
        pubBtn.className = "px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-amber-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-3xs flex items-center gap-2 cursor-pointer";
        const badge = document.getElementById('publish-badge');
        if (badge) badge.className = "w-2 h-2 rounded-full bg-amber-500 animate-pulse";
        const text = document.getElementById('publish-btn-text');
        if (text) text.textContent = "Publicar Cambios";
      }
      
      showToast(`"${colData.title}" clasificada con éxito.`);
    } catch (err) {
      console.error(err);
      showToast("Error de base de datos al clasificar", "error");
    }
  });
});

searchCollectionsInput?.addEventListener('input', () => {
  const query = searchCollectionsInput.value.toLowerCase().trim();
  document.querySelectorAll('.collection-folder').forEach((folder) => {
    const title = folder.getAttribute('data-title') || '';
    const slug = folder.getAttribute('data-slug') || '';
    if (title.includes(query) || slug.includes(query)) {
      (folder as HTMLElement).style.display = '';
    } else {
      (folder as HTMLElement).style.display = 'none';
    }
  });
});

// --- 13. Categories Management & Drag and Drop Folders ---
const createNewCategoryBtn = document.getElementById('create-new-category-btn') as HTMLButtonElement;
createNewCategoryBtn?.addEventListener('click', async () => {
  const catName = prompt("Introduce el nombre de la nueva categoría:");
  if (!catName) return;
  const trimmed = catName.trim();
  if (!trimmed) return;
  
  try {
    const { data: res } = await actions.getCollectionCategories();
    const current = res?.categories || ['Hombre', 'Mujer'];
    if (current.includes(trimmed)) {
      showToast("La categoría ya existe.", "error");
      return;
    }
    current.push(trimmed);
    const { error } = await actions.saveCollectionCategories({ categories: current });
    if (error) throw error;
    showToast("Categoría creada.");
    window.location.reload();
  } catch (err: any) {
    console.error("Error creating category:", err);
    showToast("Error al crear categoría: " + (err.message || err.code), "error");
  }
});

document.querySelectorAll('.delete-category-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const targetCat = (btn as HTMLButtonElement).dataset.category || '';
    if (!targetCat) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${targetCat}"? Las carpetas dentro de ella volverán a su asignación por defecto.`)) {
      try {
        const { data: res } = await actions.getCollectionCategories();
        let current = res?.categories || ['Hombre', 'Mujer'];
        current = current.filter((c: string) => c !== targetCat);
        
        const { error: err1 } = await actions.saveCollectionCategories({ categories: current });
        if (err1) throw err1;
        
        const dbCollections = getDbCollections() || [];
        const affectedCols = dbCollections.filter((c: any) => c.parentCategory === targetCat);
        
        for (const col of affectedCols) {
          await actions.updateCollection({
            id: col.id,
            parentCategory: null
          });
        }
        
        showToast("Categoría eliminada.");
        window.location.reload();
      } catch (err: any) {
        console.error("Error deleting category:", err);
        showToast("Error al eliminar categoría: " + (err.message || err.code), "error");
      }
    }
  });
});

// Reorder system variables
const reorderCollectionsBtn = document.getElementById('reorder-collections-btn') as HTMLButtonElement;
const saveReorderBtn = document.getElementById('save-reorder-btn') as HTMLButtonElement;
let isReorderMode = false;

const originalFolderCategories: Record<string, string> = {};
const currentFolderCategories: Record<string, string> = {};
const originalFolderOrders: Record<string, number> = {};
const currentFolderOrders: Record<string, number> = {};

function initReorderState() {
  document.querySelectorAll('.dropzone-category').forEach((dz) => {
    const catName = (dz as HTMLElement).dataset.category || '';
    const folders = dz.querySelectorAll('.draggable-folder');
    folders.forEach((folder, idx) => {
      const id = folder.getAttribute('data-id') || '';
      if (id) {
        originalFolderCategories[id] = catName;
        currentFolderCategories[id] = catName;
        originalFolderOrders[id] = idx;
        currentFolderOrders[id] = idx;
        folder.setAttribute('draggable', 'false');
      }
    });
  });
}
initReorderState();

// Toggle Reorganizar mode
reorderCollectionsBtn?.addEventListener('click', () => {
  isReorderMode = !isReorderMode;
  
  if (isReorderMode) {
    // Enable reorder mode
    reorderCollectionsBtn.innerHTML = "<span>Cancelar</span>";
    reorderCollectionsBtn.classList.remove('bg-slate-100', 'text-slate-700');
    reorderCollectionsBtn.classList.add('bg-slate-200', 'text-slate-800', 'border', 'border-slate-400');
    saveReorderBtn?.classList.remove('hidden');
    
    // Enable dragging and visual handles
    document.querySelectorAll('.draggable-folder').forEach((folder) => {
      folder.setAttribute('draggable', 'true');
      folder.classList.add('border-dashed', 'border-slate-350', 'cursor-grab', 'hover:scale-[1.02]');
    });

    // Add dashed dropzones borders
    document.querySelectorAll('.dropzone-category').forEach((dz) => {
      dz.classList.add('border-dashed', 'border-slate-300', 'bg-slate-50/70');
    });
    
    showToast("Modo reorganización activo. Arrastra las carpetas para moverlas o reordenarlas.");
  } else {
    // Cancel and reload to restore original state
    window.location.reload();
  }
});

// Helper to refresh category placeholders and recalculate parent category & order indexes
function recalculatePositions() {
  document.querySelectorAll('.dropzone-category').forEach((dz) => {
    const catName = (dz as HTMLElement).dataset.category || '';
    const gridContainer = dz.querySelector('.grid-cols-2');
    const folders = gridContainer?.querySelectorAll('.draggable-folder') || [];
    
    folders.forEach((folder, idx) => {
      const id = folder.getAttribute('data-id') || '';
      if (id) {
        currentFolderCategories[id] = catName;
        currentFolderOrders[id] = idx;
      }
    });

    const placeholder = gridContainer?.querySelector('.empty-placeholder') as HTMLElement;
    if (placeholder) {
      if (folders.length > 0) {
        placeholder.style.display = 'none';
      } else {
        placeholder.style.display = 'flex';
      }
    }
  });
}

// Drag events for folders
document.querySelectorAll('.draggable-folder').forEach((folder) => {
  folder.addEventListener('dragstart', (e) => {
    if (!isReorderMode) {
      e.preventDefault();
      return;
    }
    const dragEvent = e as DragEvent;
    dragEvent.dataTransfer?.setData('text/folder-id', folder.getAttribute('data-id') || '');
    folder.classList.add('opacity-40');
  });
  
  folder.addEventListener('dragend', () => {
    folder.classList.remove('opacity-40');
  });

  // Reordering: drag over another folder to insert before it
  folder.addEventListener('dragover', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    folder.classList.add('border-rose-500', 'border-t-2');
  });

  folder.addEventListener('dragleave', () => {
    folder.classList.remove('border-rose-500', 'border-t-2');
  });

  folder.addEventListener('drop', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    folder.classList.remove('border-rose-500', 'border-t-2');

    const dragEvent = e as DragEvent;
    const draggedId = dragEvent.dataTransfer?.getData('text/folder-id') || '';
    if (!draggedId || draggedId === folder.getAttribute('data-id')) return;

    const draggedEl = document.querySelector(`.draggable-folder[data-id="${draggedId}"]`);
    if (draggedEl && folder.parentNode) {
      folder.parentNode.insertBefore(draggedEl, folder);
      recalculatePositions();
    }
  });
});

// Dropzones for categories
document.querySelectorAll('.dropzone-category').forEach((dropzone) => {
  dropzone.addEventListener('dragover', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    dropzone.classList.add('bg-slate-100/80', 'border-rose-400');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('bg-slate-100/80', 'border-rose-400');
  });

  dropzone.addEventListener('drop', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    dropzone.classList.remove('bg-slate-100/80', 'border-rose-400');
    
    const dragEvent = e as DragEvent;
    const folderId = dragEvent.dataTransfer?.getData('text/folder-id') || '';
    const newCategory = (dropzone as HTMLElement).dataset.category || '';
    
    if (!folderId || !newCategory) return;
    
    // Find the folder element and append it to target grid container if not already dropped inside
    const folderEl = document.querySelector(`.draggable-folder[data-id="${folderId}"]`);
    const gridContainer = dropzone.querySelector('.grid-cols-2');
    
    if (folderEl && gridContainer && !gridContainer.contains(e.target as Node)) {
      gridContainer.appendChild(folderEl);
      recalculatePositions();
    }
  });
});

// Save Reorder changes in batch
saveReorderBtn?.addEventListener('click', async () => {
  if (!isReorderMode) return;
  
  const updatePromises = [];
  for (const [id, newCat] of Object.entries(currentFolderCategories)) {
    const oldCat = originalFolderCategories[id];
    const newOrder = currentFolderOrders[id];
    const oldOrder = originalFolderOrders[id];
    
    if (newCat !== oldCat || newOrder !== oldOrder) {
      updatePromises.push(actions.updateCollection({ 
        id, 
        parentCategory: newCat,
        indexOrder: newOrder
      }));
    }
  }
  
  if (updatePromises.length === 0) {
    showToast("No se han realizado cambios en la organización.");
    window.location.reload();
    return;
  }
  
  saveReorderBtn.disabled = true;
  saveReorderBtn.textContent = "Guardando...";
  reorderCollectionsBtn.disabled = true;
  
  try {
    const results = await Promise.all(updatePromises);
    const failed = results.find(res => res.error !== undefined);
    if (failed) throw failed.error;
    
    localStorage.setItem('flexform_pending_changes', 'true');
    showToast("Organización guardada correctamente.");
    window.location.reload();
  } catch (err: any) {
    console.error("Error saving organization:", err);
    showToast("Error al guardar organización: " + (err.message || err.code), "error");
    saveReorderBtn.disabled = false;
    saveReorderBtn.textContent = "Guardar Organización";
    reorderCollectionsBtn.disabled = false;
  }
});
