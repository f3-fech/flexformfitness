import { actions } from 'astro:actions';
import { getObjectPosition, getColorHex, isLightColor, formatHex, isValidHex, presetFitnessColors } from '../../lib/utils';
import { state, getDbCollections, getDbProducts, getStoreColors, setStoreColors } from './state';
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

// Product Multimedia & Drag and Drop Elements
const mediaContainer = document.getElementById('media-container') as HTMLDivElement;
const mediaUploadPcBtn = document.getElementById('media-upload-pc-btn') as HTMLButtonElement;
const productMediaFileInput = document.getElementById('product-media-file-input') as HTMLInputElement;
const productMediaUploadProgress = document.getElementById('product-media-upload-progress') as HTMLDivElement;
const productMediaProgressStatus = document.getElementById('product-media-progress-status') as HTMLSpanElement;
const productMediaProgressPercent = document.getElementById('product-media-progress-percent') as HTMLSpanElement;
const productMediaProgressBar = document.getElementById('product-media-progress-bar') as HTMLDivElement;

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
const gallerySearchInput = document.getElementById('gallery-search-input') as HTMLInputElement;
const galleryFoldersContainer = document.getElementById('gallery-folders-container') as HTMLDivElement;
const galleryTotalCount = document.getElementById('gallery-total-count') as HTMLSpanElement;
const galleryUploadProgress = document.getElementById('gallery-upload-progress') as HTMLDivElement;
const galleryProgressStatus = document.getElementById('gallery-progress-status') as HTMLSpanElement;
const galleryProgressPercent = document.getElementById('gallery-progress-percent') as HTMLSpanElement;
const galleryProgressBar = document.getElementById('gallery-progress-bar') as HTMLDivElement;
const galleryDropzoneArea = document.getElementById('gallery-dropzone-area') as HTMLDivElement;
const galleryCurrentFolderTitle = document.getElementById('gallery-current-folder-title') as HTMLSpanElement;

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

// Helper to determine collection category
export function getCollectionCategory(col: any): 'Hombre' | 'Mujer' | 'Portada' | 'F3 Synergies' | 'General' {
  if (col.parentCategory === 'Hombre') return 'Hombre';
  if (col.parentCategory === 'Mujer') return 'Mujer';
  if (col.parentCategory === 'Portada') return 'Portada';
  if (col.parentCategory === 'F3 Synergies') return 'F3 Synergies';
  if (col.parentCategory === 'General') return 'General';

  if (col.isSynergy) return 'F3 Synergies';
  if (col.showOnIndex) return 'Portada';

  const isMen = col.slug?.includes('hombre') || col.title?.toLowerCase().includes('hombre') || col.title?.toLowerCase().includes('men');
  const isWomen = col.slug?.includes('mujer') || col.title?.toLowerCase().includes('mujer') || col.title?.toLowerCase().includes('women');
  if (isMen) return 'Hombre';
  if (isWomen) return 'Mujer';
  return 'General';
}

// Function to synchronize collection checkboxes and enforce anti-duplicate / gender isolation rules
export function syncProductCollectionsRules() {
  const container = document.getElementById('product-collections-container');
  if (!container) return;

  const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>('input[name="product-col-assoc"]'));
  const checkedBoxes = checkboxes.filter((cb) => cb.checked);

  const hasCheckedHombre = checkedBoxes.some((cb) => cb.dataset.category === 'Hombre');
  const hasCheckedMujer = checkedBoxes.some((cb) => cb.dataset.category === 'Mujer');
  const hasCheckedPortada = checkedBoxes.some((cb) => cb.dataset.category === 'Portada');

  const genderRadio = document.querySelector('input[name="product-gender-assoc"]:checked') as HTMLInputElement | null;
  let currentGender = genderRadio ? genderRadio.value : '';

  // Auto-sync radio with checked collections
  if (hasCheckedHombre && currentGender !== 'hombre') {
    currentGender = 'hombre';
    document.querySelectorAll<HTMLInputElement>('input[name="product-gender-assoc"]').forEach((r) => {
      r.checked = (r.value === 'hombre');
    });
  } else if (hasCheckedMujer && currentGender !== 'mujer') {
    currentGender = 'mujer';
    document.querySelectorAll<HTMLInputElement>('input[name="product-gender-assoc"]').forEach((r) => {
      r.checked = (r.value === 'mujer');
    });
  }

  checkboxes.forEach((cb) => {
    const label = cb.closest('label');
    const badgeEl = label?.querySelector('.col-conflict-badge') as HTMLElement | null;
    const cat = cb.dataset.category;
    const isChecked = cb.checked;

    if (cat === 'Hombre') {
      if (hasCheckedMujer || currentGender === 'mujer') {
        cb.disabled = true;
        if (isChecked) cb.checked = false;
        label?.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.remove('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = `<span class="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">En uso: Mujer</span>`;
      } else if (hasCheckedHombre && !isChecked) {
        cb.disabled = true;
        label?.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.remove('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = `<span class="text-[8px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">En uso: Hombre</span>`;
      } else {
        cb.disabled = false;
        label?.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.add('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = '';
      }
    } else if (cat === 'Mujer') {
      if (hasCheckedHombre || currentGender === 'hombre') {
        cb.disabled = true;
        if (isChecked) cb.checked = false;
        label?.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.remove('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = `<span class="text-[8px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">En uso: Hombre</span>`;
      } else if (hasCheckedMujer && !isChecked) {
        cb.disabled = true;
        label?.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.remove('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = `<span class="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">En uso: Mujer</span>`;
      } else {
        cb.disabled = false;
        label?.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.add('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = '';
      }
    } else if (cat === 'Portada') {
      if (hasCheckedPortada && !isChecked) {
        cb.disabled = true;
        label?.classList.add('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.remove('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = `<span class="text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">En uso: Portada</span>`;
      } else {
        cb.disabled = false;
        label?.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
        label?.classList.add('hover:bg-slate-100', 'cursor-pointer');
        if (badgeEl) badgeEl.innerHTML = '';
      }
    } else {
      // General
      cb.disabled = false;
      label?.classList.remove('opacity-40', 'cursor-not-allowed', 'bg-slate-50');
      label?.classList.add('hover:bg-slate-100', 'cursor-pointer');
      if (badgeEl) badgeEl.innerHTML = '';
    }
  });
}

// Global listener for gender radio buttons change
document.querySelectorAll('input[name="product-gender-assoc"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const val = (radio as HTMLInputElement).value;
    if (val === 'hombre') {
      document.querySelectorAll<HTMLInputElement>('input[name="product-col-assoc"][data-category="Mujer"]:checked').forEach((cb) => {
        cb.checked = false;
      });
    } else if (val === 'mujer') {
      document.querySelectorAll<HTMLInputElement>('input[name="product-col-assoc"][data-category="Hombre"]:checked').forEach((cb) => {
        cb.checked = false;
      });
    }
    syncProductCollectionsRules();
  });
});

// --- 1. Product Collections Associations Render ---
export function renderProductCollections(productId: string | null) {
  const container = document.getElementById('product-collections-container');
  if (!container) return;

  container.innerHTML = '';
  const dbCollections = getDbCollections() || [];

  // Determine initial gender association from subcollections
  let hasHombre = false;
  let hasMujer = false;
  
  if (productId) {
    hasHombre = dbCollections.some((c: any) => {
      const isMen = getCollectionCategory(c) === 'Hombre';
      return isMen && (c.productIds || []).includes(productId);
    });
    hasMujer = dbCollections.some((c: any) => {
      const isWomen = getCollectionCategory(c) === 'Mujer';
      return isWomen && (c.productIds || []).includes(productId);
    });
  }

  // Update gender radio buttons
  const genderVal = (hasHombre && hasMujer) ? 'unisex' : hasHombre ? 'hombre' : hasMujer ? 'mujer' : '';
  document.querySelectorAll('input[name="product-gender-assoc"]').forEach((radio) => {
    const rEl = radio as HTMLInputElement;
    rEl.checked = (rEl.value === genderVal);
  });

  if (dbCollections.length === 0) {
    container.innerHTML = `<span class="text-slate-400 font-medium text-xs">No hay colecciones creadas en la tienda.</span>`;
    return;
  }

  dbCollections.forEach((col: any) => {
    // Exclude fixed root Hombre & Mujer collections
    if (col.slug === 'hombre' || col.slug === 'mujer') return;

    const cat = getCollectionCategory(col);
    const isAssociated = productId ? (col.productIds || []).includes(productId) : false;
    
    const label = document.createElement('label');
    label.className = 'flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-slate-100 cursor-pointer select-none transition-colors border border-transparent hover:border-slate-200';
    label.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0">
        <input type="checkbox" name="product-col-assoc" value="${col.id}" data-category="${cat}" ${isAssociated ? 'checked' : ''} class="w-3.5 h-3.5 text-rose-600 border-slate-355 rounded-sm focus:ring-rose-500 cursor-pointer shrink-0" />
        <div class="flex flex-col min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-slate-800 text-[11px] leading-tight truncate">${col.title}</span>
            <span class="px-1.5 py-0.2 text-[8px] font-black uppercase rounded ${
              cat === 'Hombre' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
              cat === 'Mujer' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
              cat === 'Portada' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              cat === 'F3 Synergies' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              'bg-slate-100 text-slate-500 border border-slate-200'
            }">${cat}</span>
          </div>
          <span class="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">Slug: ${col.slug}</span>
        </div>
      </div>
      <div class="col-conflict-badge shrink-0"></div>
    `;

    label.querySelector('input')?.addEventListener('change', () => {
      syncProductCollectionsRules();
    });

    container.appendChild(label);
  });

  syncProductCollectionsRules();
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
  
  state.gallery.currentProductContext = { id: null, slug: null, title: null };
  state.gallery.selectedFolder = 'all';

  state.product.images = [];
  renderProductMedia();

  variantTreeContainer.innerHTML = '';
  const firstSavedColor = getStoreColors()[0];
  const initialColorName = firstSavedColor?.name || 'Negro';
  const initialColorHex = firstSavedColor?.hex || '#0f172a';
  addColorBranch(initialColorName, initialColorHex, '', [
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
        aspectRatio: 2 / 3,
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

function cleanSkuPart(val: string): string {
  return val
    .toUpperCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBranchColorCode(branchEl: HTMLElement): string {
  const branches = Array.from(document.querySelectorAll('.color-branch'));
  const idx = branches.indexOf(branchEl);
  return `COLOR${idx >= 0 ? idx + 1 : 1}`;
}

function updateAllSKUs() {
  if (!slugInput) return;
  const slugVal = cleanSkuPart(slugInput.value);
  const productBranches = document.querySelectorAll('.color-branch');
  
  productBranches.forEach((branch, bIdx) => {
    const colorCode = `COLOR${bIdx + 1}`;
    const sizeRows = branch.querySelectorAll('.size-row');
    
    sizeRows.forEach((row) => {
      const sizeInput = row.querySelector('.size-name') as HTMLInputElement;
      const skuInput = row.querySelector('.size-sku') as HTMLInputElement;
      if (!sizeInput || !skuInput) return;
      const sizeVal = cleanSkuPart(sizeInput.value);
      
      const parts = [slugVal, colorCode, sizeVal].filter(Boolean);
      skuInput.value = parts.join('-');
    });
  });
}

function updateSKUsForBranch(branchEl: HTMLElement) {
  if (!slugInput) return;
  const slugVal = cleanSkuPart(slugInput.value);
  const colorCode = getBranchColorCode(branchEl);
  
  const sizeRows = branchEl.querySelectorAll('.size-row');
  sizeRows.forEach((row) => {
    const sizeInput = row.querySelector('.size-name') as HTMLInputElement;
    const skuInput = row.querySelector('.size-sku') as HTMLInputElement;
    if (!sizeInput || !skuInput) return;
    const sizeVal = cleanSkuPart(sizeInput.value);
    
    const parts = [slugVal, colorCode, sizeVal].filter(Boolean);
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

// --- 7. Drag-and-drop Product Multimedia Grid & Compression Upload ---
let isUploadingMedia = false;

export async function handleUploadProductFiles(files: FileList | File[]) {
  const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (fileArray.length === 0) {
    showToast("Por favor selecciona archivos de imagen válidos (JPG, PNG, WebP, etc.).", "error");
    return;
  }

  if (isUploadingMedia) return;
  isUploadingMedia = true;

  const total = fileArray.length;
  const currentSlug = (slugInput?.value || (document.getElementById('form-title') as HTMLInputElement)?.value || state.gallery.currentProductContext.slug || 'product')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 35) || 'product';

  if (productMediaUploadProgress) {
    productMediaUploadProgress.classList.remove('hidden');
    if (productMediaProgressBar) productMediaProgressBar.style.width = '0%';
    if (productMediaProgressPercent) productMediaProgressPercent.textContent = '0%';
    if (productMediaProgressStatus) productMediaProgressStatus.textContent = `Preparando ${total} imagen(es)...`;
  }

  try {
    for (let i = 0; i < total; i++) {
      const file = fileArray[i];
      const basePercent = Math.round((i / total) * 100);
      const nextStepPercent = Math.round(((i + 1) / total) * 100);

      const url = await handleImageUpload(file, currentSlug, (statusText, subPercent) => {
        const itemPercent = basePercent + Math.round((subPercent / 100) * (nextStepPercent - basePercent));
        if (productMediaProgressBar) productMediaProgressBar.style.width = `${itemPercent}%`;
        if (productMediaProgressPercent) productMediaProgressPercent.textContent = `${itemPercent}%`;
        if (productMediaProgressStatus) {
          productMediaProgressStatus.textContent = `[${i + 1}/${total}] ${statusText}`;
        }
      });

      state.product.images.push(url);
      renderProductMedia();
    }

    if (productMediaProgressBar) productMediaProgressBar.style.width = '100%';
    if (productMediaProgressPercent) productMediaProgressPercent.textContent = '100%';
    if (productMediaProgressStatus) productMediaProgressStatus.textContent = '✓ ¡Imágenes optimizadas y subidas con éxito!';
    showToast(`${total} imagen(es) procesada(s) y añadida(s) al producto.`);
  } catch (err: any) {
    console.error("Error al subir imágenes:", err);
    showToast(`Error al subir imagen: ${err.message || 'Error desconocido'}`, "error");
  } finally {
    isUploadingMedia = false;
    setTimeout(() => {
      if (productMediaUploadProgress) {
        productMediaUploadProgress.classList.add('hidden');
        if (productMediaProgressBar) productMediaProgressBar.style.width = '0%';
      }
    }, 1500);
  }
}

export function renderProductMedia() {
  if (!mediaContainer) return;
  mediaContainer.innerHTML = "";

  if (state.product.images.length === 0) {
    mediaContainer.innerHTML = `
      <div id="media-empty-dropzone" class="col-span-full flex flex-col items-center justify-center py-6 text-slate-400 gap-2 select-none hover:text-slate-600 transition-colors">
        <div class="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-3xs flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
        </div>
        <div class="text-center">
          <span class="text-xs font-bold text-slate-700 block">Arrastra tus fotos aquí para optimizar</span>
          <span class="text-[10px] text-slate-400">Conversión y compresión automática a WebP ultrarrápida</span>
        </div>
      </div>
    `;

    document.getElementById('media-empty-dropzone')?.addEventListener('click', () => {
      productMediaFileInput?.click();
    });
    return;
  }

  state.product.images.forEach((url, idx) => {
    const card = document.createElement('div');
    card.className = "group relative aspect-[2/3] bg-white border border-slate-200 rounded-xl overflow-hidden cursor-move transition-all duration-200 select-none shadow-3xs hover:border-rose-400";
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
      openRemoveMediaModal(url, idx);
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
      
      // If external files dropped on a specific card
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleUploadProductFiles(e.dataTransfer.files);
        return;
      }

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

// Media Container File Dropzone Events
if (mediaContainer) {
  ['dragenter', 'dragover'].forEach(eventName => {
    mediaContainer.addEventListener(eventName, (e) => {
      const dragEv = e as DragEvent;
      if (dragEv.dataTransfer?.types.includes('Files')) {
        dragEv.preventDefault();
        dragEv.stopPropagation();
        mediaContainer.classList.add('border-rose-500', 'bg-rose-50/40', 'ring-4', 'ring-rose-500/15', 'scale-[1.005]');
      }
    });
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    mediaContainer.addEventListener(eventName, (e) => {
      const mouseEv = e as MouseEvent;
      const rect = mediaContainer.getBoundingClientRect();
      const isOut = mouseEv.clientX < rect.left || mouseEv.clientX > rect.right || mouseEv.clientY < rect.top || mouseEv.clientY > rect.bottom;
      if (isOut) {
        mediaContainer.classList.remove('border-rose-500', 'bg-rose-50/40', 'ring-4', 'ring-rose-500/15', 'scale-[1.005]');
      }
    });
  });

  mediaContainer.addEventListener('drop', (e) => {
    const dragEv = e as DragEvent;
    mediaContainer.classList.remove('border-rose-500', 'bg-rose-50/40', 'ring-4', 'ring-rose-500/15', 'scale-[1.005]');
    if (dragEv.dataTransfer?.files && dragEv.dataTransfer.files.length > 0) {
      dragEv.preventDefault();
      dragEv.stopPropagation();
      handleUploadProductFiles(dragEv.dataTransfer.files);
    }
  });
}

// PC File Upload Button listener
mediaUploadPcBtn?.addEventListener('click', () => {
  productMediaFileInput?.click();
});

productMediaFileInput?.addEventListener('change', () => {
  if (productMediaFileInput.files && productMediaFileInput.files.length > 0) {
    handleUploadProductFiles(productMediaFileInput.files);
    productMediaFileInput.value = "";
  }
});

// Open gallery to select image for main catalog media
document.getElementById('add-media-btn')?.addEventListener('click', () => {
  state.gallery.activeInput = null;
  state.gallery.activePreview = null;
  const currentSlug = slugInput?.value?.trim() || null;
  const currentTitle = titleInput?.value?.trim() || null;
  const currentId = (document.getElementById('form-product-id') as HTMLInputElement)?.value || null;
  
  state.gallery.currentProductContext = {
    id: currentId,
    slug: currentSlug,
    title: currentTitle,
  };
  if (currentSlug) {
    state.gallery.selectedFolder = currentSlug;
  }
  toggleGalleryModal(true);
});

// --- 8. Smart Image Gallery Logic with Automatic Product Folders & Real-Time Search ---
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

function renderGalleryFolders() {
  if (!galleryFoldersContainer) return;
  galleryFoldersContainer.innerHTML = "";

  const dbProducts = getDbProducts();
  const allImages = state.gallery.images;
  const totalCount = allImages.length;

  // Folder Counts mapping
  const counts: Record<string, number> = { all: totalCount, hero: 0, unassigned: 0 };
  const currentContext = state.gallery.currentProductContext;

  dbProducts.forEach((p: any) => {
    counts[p.slug] = 0;
  });

  allImages.forEach(img => {
    if (img.productSlug === 'hero' || img.name.toLowerCase().startsWith('hero_') || img.name.toLowerCase().startsWith('hero/') || img.name.toLowerCase().includes('hero')) {
      counts.hero++;
    } else if (img.productSlug && counts[img.productSlug] !== undefined) {
      counts[img.productSlug]++;
    } else if (img.productSlug) {
      counts[img.productSlug] = (counts[img.productSlug] || 0) + 1;
    } else {
      counts.unassigned++;
    }
  });

  // Vertical Sidebar Item Helper
  const createFolderItem = (id: string, icon: string, label: string, count: number, isCurrentBadge = false) => {
    const isSelected = state.gallery.selectedFolder === id;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 flex items-center justify-between gap-2 shadow-3xs cursor-pointer select-none ${
      isSelected
        ? 'bg-rose-600 text-white font-bold shadow-2xs'
        : isCurrentBadge
        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold'
        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70 hover:border-slate-300 font-semibold'
    }`;
    btn.innerHTML = `
      <div class="flex items-center gap-2 truncate min-w-0">
        <span class="text-sm shrink-0 select-none">${icon}</span>
        <span class="truncate">${label}</span>
      </div>
      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/60'}">${count}</span>
    `;
    btn.addEventListener('click', () => {
      state.gallery.selectedFolder = id;
      renderGalleryFolders();
      renderFilteredGallery();
    });
    return btn;
  };

  // 1. "Todas"
  galleryFoldersContainer.appendChild(createFolderItem('all', '📁', 'Todas las fotos', totalCount));

  // 2. "Este Producto" if editing/creating a product
  if (currentContext.slug && currentContext.slug !== 'hero') {
    const label = `Este Producto (${currentContext.title || currentContext.slug})`;
    galleryFoldersContainer.appendChild(createFolderItem(currentContext.slug, '⭐', label, counts[currentContext.slug] || 0, true));
  }

  // Section Header: "PORTADA Y HERO"
  const heroDivider = document.createElement('div');
  heroDivider.className = 'px-2 pt-2.5 pb-0.5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono select-none flex items-center justify-between';
  heroDivider.innerHTML = `
    <span>Página Principal</span>
  `;
  galleryFoldersContainer.appendChild(heroDivider);

  // Dedicated "Hero / Portada (Alta Calidad)" folder
  galleryFoldersContainer.appendChild(createFolderItem('hero', '🌟', 'Hero / Portadas (Alta Calidad)', counts.hero, currentContext.slug === 'hero'));

  // Section Header: "POR PRODUCTO"
  const sectionDivider = document.createElement('div');
  sectionDivider.className = 'px-2 pt-2.5 pb-0.5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono select-none flex items-center justify-between';
  sectionDivider.innerHTML = `
    <span>Productos</span>
    <span class="text-[8px] bg-slate-200/70 text-slate-500 px-1.5 py-0.2 rounded-full">${dbProducts.length}</span>
  `;
  galleryFoldersContainer.appendChild(sectionDivider);

  // 3. Folders for each product
  dbProducts.forEach((p: any) => {
    if (currentContext.slug && p.slug === currentContext.slug) return; // already added above as 'Este Producto'
    const count = counts[p.slug] || 0;
    galleryFoldersContainer.appendChild(createFolderItem(p.slug, '📂', p.title, count));
  });

  // 4. "Generales / Sin Asignar"
  const generalDivider = document.createElement('div');
  generalDivider.className = 'px-2 pt-2 pb-0.5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono select-none';
  generalDivider.textContent = 'Otros';
  galleryFoldersContainer.appendChild(generalDivider);

  galleryFoldersContainer.appendChild(createFolderItem('unassigned', '📦', 'Generales / Sin producto', counts.unassigned));

  // Sync title above images grid
  if (galleryCurrentFolderTitle) {
    if (state.gallery.selectedFolder === 'all') {
      galleryCurrentFolderTitle.innerHTML = `📁 Todas las fotos <span class="text-slate-400 font-mono text-[11px] font-normal">(${totalCount})</span>`;
    } else if (state.gallery.selectedFolder === 'hero') {
      galleryCurrentFolderTitle.innerHTML = `🌟 Carpeta: <span class="text-rose-600 font-black">Hero / Portadas (Mínima compresión, Calidad 98%)</span> <span class="text-slate-400 font-mono text-[11px] font-normal">(${counts.hero})</span>`;
    } else if (state.gallery.selectedFolder === 'unassigned') {
      galleryCurrentFolderTitle.innerHTML = `📦 Fotos Generales <span class="text-slate-400 font-mono text-[11px] font-normal">(${counts.unassigned})</span>`;
    } else {
      const activeProd = dbProducts.find((p: any) => p.slug === state.gallery.selectedFolder);
      const title = activeProd ? activeProd.title : state.gallery.selectedFolder;
      const count = counts[state.gallery.selectedFolder] || 0;
      galleryCurrentFolderTitle.innerHTML = `📂 Carpeta: <span class="text-rose-600 font-black">${title}</span> <span class="text-slate-400 font-mono text-[11px] font-normal">(${count})</span>`;
    }
  }
}

function renderFilteredGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = "";

  const query = (state.gallery.searchQuery || "").toLowerCase().trim();
  const folder = state.gallery.selectedFolder;

  const filtered = state.gallery.images.filter(img => {
    // 1. Folder filter
    if (folder !== 'all') {
      if (folder === 'hero') {
        const isHero = img.productSlug === 'hero' || img.name.toLowerCase().startsWith('hero_') || img.name.toLowerCase().startsWith('hero/') || img.name.toLowerCase().includes('hero');
        if (!isHero) return false;
      } else if (folder === 'unassigned') {
        const isHero = img.productSlug === 'hero' || img.name.toLowerCase().startsWith('hero_') || img.name.toLowerCase().startsWith('hero/') || img.name.toLowerCase().includes('hero');
        if (img.productSlug || isHero) return false;
      } else if (img.productSlug !== folder) {
        return false;
      }
    }

    // 2. Search query filter
    if (query) {
      const matchName = img.name.toLowerCase().includes(query);
      const matchProduct = (img.productTitle || "").toLowerCase().includes(query);
      if (!matchName && !matchProduct) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    galleryEmpty?.classList.remove('hidden');
    return;
  }

  galleryEmpty?.classList.add('hidden');

  filtered.forEach((img) => {
    const card = document.createElement('div');
    const isSelected = state.gallery.selectedUrl === img.url;
    card.className = `group relative aspect-[2/3] bg-white border rounded-xl overflow-hidden cursor-pointer hover:border-rose-500 hover:shadow-md transition-all duration-200 ${
      isSelected ? 'selected-gallery-card border-rose-600 ring-2 ring-rose-600' : 'border-slate-200'
    }`;

    const cleanName = img.name.split('/').pop() || img.name;
    const isHeroImg = img.productSlug === 'hero' || cleanName.toLowerCase().startsWith('hero_');
    const badgeHtml = isHeroImg
      ? `<span class="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-3xs max-w-[85%] truncate select-none">Hero HQ</span>`
      : img.productTitle
      ? `<span class="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-3xs max-w-[85%] truncate select-none">${img.productTitle}</span>`
      : `<span class="absolute top-1.5 left-1.5 bg-slate-500/80 backdrop-blur-xs text-white text-[7px] font-bold px-1 py-0.5 rounded shadow-3xs select-none">General</span>`;

    card.innerHTML = `
      <img src="${img.url}" class="w-full h-full object-cover select-none" alt="${cleanName}" loading="lazy" />
      ${badgeHtml}
      <div class="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs p-1 px-2 text-[8px] text-white truncate font-mono select-none">${cleanName}</div>
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

    card.addEventListener('dblclick', () => {
      state.gallery.selectedUrl = img.url;
      insertGalleryBtn?.click();
    });

    galleryGrid.appendChild(card);
  });
}

async function loadGalleryImages() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = "";
  galleryLoading.classList.remove('hidden');
  galleryEmpty.classList.add('hidden');

  try {
    const { data, error } = await actions.listUploadedImages();
    if (error || !data?.success) {
      console.error("Error loading gallery:", error);
      showToast("Error al cargar la galería de imágenes.", "error");
      return;
    }

    const dbProducts = getDbProducts();
    const rawImages = (data.images || []).filter((img: any) => !img.name.startsWith('crop_'));

    // Intelligent Association: Map each image to its product or hero category
    state.gallery.images = rawImages.map((img: any) => {
      const fileName = img.name.toLowerCase();
      const isHero = fileName.startsWith('hero_') || fileName.startsWith('hero/') || fileName.includes('hero');

      let matchedProduct = isHero ? null : dbProducts.find((p: any) => {
        // Match by exact URL in product media
        const inMain = (p.images || []).includes(img.url);
        const inVariants = (p.variants || []).some((v: any) => v.image === img.url);
        if (inMain || inVariants) return true;

        // Match by product slug in file path/name
        if (p.slug && (fileName.startsWith(p.slug.toLowerCase() + '_') || fileName.startsWith(p.slug.toLowerCase() + '/') || fileName.includes(p.slug.toLowerCase()))) {
          return true;
        }
        return false;
      });

      return {
        name: img.name,
        url: img.url,
        timeCreated: img.timeCreated,
        productId: matchedProduct?.id || (isHero ? 'hero' : null),
        productSlug: isHero ? 'hero' : (matchedProduct?.slug || null),
        productTitle: isHero ? 'Hero Slide (Portada)' : (matchedProduct?.title || null),
      };
    });

    if (galleryTotalCount) {
      galleryTotalCount.textContent = state.gallery.images.length.toString();
    }

    // Default to 'all' if active folder doesn't exist
    renderGalleryFolders();
    renderFilteredGallery();
  } catch (err) {
    console.error("Error fetching images:", err);
  } finally {
    galleryLoading.classList.add('hidden');
  }
}

// Gallery Real-Time Search Handler
gallerySearchInput?.addEventListener('input', () => {
  state.gallery.searchQuery = gallerySearchInput.value;
  renderFilteredGallery();
});

// Gallery Drag & Drop and Upload
async function handleGalleryUpload(files: FileList | File[]) {
  const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (fileArray.length === 0) {
    showToast("Por favor selecciona archivos de imagen válidos.", "error");
    return;
  }

  const currentFolder = state.gallery.selectedFolder;
  const currentContext = state.gallery.currentProductContext;
  const isHeroFolder = currentFolder === 'hero' || currentContext.slug === 'hero';

  const uploadPrefix = isHeroFolder
    ? 'hero'
    : (currentFolder !== 'all' && currentFolder !== 'unassigned')
    ? currentFolder
    : currentContext.slug || 'gallery';

  const uploadOptions = isHeroFolder
    ? { quality: 0.98, maxDimension: 3840, folder: 'hero/gallery' }
    : {};

  if (galleryUploadProgress) {
    galleryUploadProgress.classList.remove('hidden');
    if (galleryProgressBar) galleryProgressBar.style.width = '0%';
    if (galleryProgressPercent) galleryProgressPercent.textContent = '0%';
    if (galleryProgressStatus) galleryProgressStatus.textContent = `Subiendo ${fileArray.length} archivo(s)...`;
  }

  try {
    let lastUrl = '';
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const basePercent = Math.round((i / fileArray.length) * 100);
      const nextPercent = Math.round(((i + 1) / fileArray.length) * 100);

      lastUrl = await handleImageUpload(file, uploadPrefix, (statusText, subPercent) => {
        const itemPercent = basePercent + Math.round((subPercent / 100) * (nextPercent - basePercent));
        if (galleryProgressBar) galleryProgressBar.style.width = `${itemPercent}%`;
        if (galleryProgressPercent) galleryProgressPercent.textContent = `${itemPercent}%`;
        if (galleryProgressStatus) galleryProgressStatus.textContent = `[${i + 1}/${fileArray.length}] ${statusText}`;
      }, uploadOptions);
    }

    if (galleryProgressBar) galleryProgressBar.style.width = '100%';
    if (galleryProgressPercent) galleryProgressPercent.textContent = '100%';
    if (galleryProgressStatus) galleryProgressStatus.textContent = isHeroFolder ? '✓ ¡Subida en Alta Calidad (Hero) completada!' : '✓ ¡Subida y optimización completadas!';
    showToast(`${fileArray.length} imagen(es) subida(s) con éxito.`);
    await loadGalleryImages();

    // Auto-select the last uploaded image
    if (lastUrl) {
      state.gallery.selectedUrl = lastUrl;
      renderFilteredGallery();
      insertGalleryBtn.disabled = false;
      deleteGalleryImgBtn?.classList.remove('hidden');
    }
  } catch (err: any) {
    console.error("Gallery upload error:", err);
    showToast(`Error al subir imagen: ${err.message || 'Error desconocido'}`, "error");
  } finally {
    setTimeout(() => {
      if (galleryUploadProgress) {
        galleryUploadProgress.classList.add('hidden');
        if (galleryProgressBar) galleryProgressBar.style.width = '0%';
      }
    }, 1500);
  }
}

// Gallery Dropzone Area
if (galleryDropzoneArea) {
  ['dragenter', 'dragover'].forEach(eventName => {
    galleryDropzoneArea.addEventListener(eventName, (e) => {
      const dragEv = e as DragEvent;
      if (dragEv.dataTransfer?.types.includes('Files')) {
        dragEv.preventDefault();
        dragEv.stopPropagation();
        galleryDropzoneArea.classList.add('ring-4', 'ring-rose-500/20', 'bg-rose-50/20');
      }
    });
  });

  ['dragleave', 'dragend'].forEach(eventName => {
    galleryDropzoneArea.addEventListener(eventName, () => {
      galleryDropzoneArea.classList.remove('ring-4', 'ring-rose-500/20', 'bg-rose-50/20');
    });
  });

  galleryDropzoneArea.addEventListener('drop', (e) => {
    const dragEv = e as DragEvent;
    galleryDropzoneArea.classList.remove('ring-4', 'ring-rose-500/20', 'bg-rose-50/20');
    if (dragEv.dataTransfer?.files && dragEv.dataTransfer.files.length > 0) {
      dragEv.preventDefault();
      dragEv.stopPropagation();
      handleGalleryUpload(dragEv.dataTransfer.files);
    }
  });
}

function openGallery(inputEl: HTMLInputElement, previewEl: HTMLDivElement) {
  state.gallery.activeInput = inputEl;
  state.gallery.activePreview = previewEl;
  const currentSlug = slugInput?.value?.trim() || null;
  state.gallery.currentProductContext = {
    id: (document.getElementById('form-product-id') as HTMLInputElement)?.value || null,
    slug: currentSlug,
    title: titleInput?.value?.trim() || null,
  };
  if (currentSlug) {
    state.gallery.selectedFolder = currentSlug;
  }
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
  const decodedName = imgName ? decodeURIComponent(imgName).replace('products/gallery/', '') : 'imagen';
  
  if (confirm(`¿Estás seguro de que deseas eliminar la imagen "${decodedName}" permanentemente de Firebase Storage?`)) {
    deleteGalleryImgBtn.disabled = true;
    const originalText = deleteGalleryImgBtn.innerHTML;
    deleteGalleryImgBtn.innerHTML = "<span>Eliminando...</span>";
    
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
      showToast("Error al eliminar la imagen: " + (err.message || err.code), "error");
    } finally {
      deleteGalleryImgBtn.disabled = false;
      deleteGalleryImgBtn.innerHTML = originalText;
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
  if (galleryFileInput.files && galleryFileInput.files.length > 0) {
    await handleGalleryUpload(galleryFileInput.files);
    galleryFileInput.value = "";
  }
});

// --- 8.1. Modal: Eliminar / Quitar Imagen de Producto ---
const removeMediaModal = document.getElementById('remove-media-modal') as HTMLDivElement;
const closeRemoveMediaModal = document.getElementById('close-remove-media-modal') as HTMLButtonElement;
const cancelRemoveMediaBtn = document.getElementById('cancel-remove-media-btn') as HTMLButtonElement;
const removeMediaPreviewImg = document.getElementById('remove-media-preview-img') as HTMLImageElement;
const btnRemoveFromProductOnly = document.getElementById('btn-remove-from-product-only') as HTMLButtonElement;
const btnDeleteFromDbStorage = document.getElementById('btn-delete-from-db-storage') as HTMLButtonElement;

let pendingMediaRemoval: { url: string; index: number } | null = null;

function openRemoveMediaModal(url: string, index: number) {
  pendingMediaRemoval = { url, index };
  if (removeMediaPreviewImg) {
    removeMediaPreviewImg.src = url;
  }
  toggleModal(removeMediaModal, true);
}

function closeRemoveMediaPrompt() {
  toggleModal(removeMediaModal, false);
  pendingMediaRemoval = null;
  if (btnDeleteFromDbStorage) {
    btnDeleteFromDbStorage.disabled = false;
    btnDeleteFromDbStorage.classList.remove('opacity-60', 'pointer-events-none');
  }
}

closeRemoveMediaModal?.addEventListener('click', closeRemoveMediaPrompt);
cancelRemoveMediaBtn?.addEventListener('click', closeRemoveMediaPrompt);

btnRemoveFromProductOnly?.addEventListener('click', () => {
  if (!pendingMediaRemoval) return;
  const { index } = pendingMediaRemoval;
  
  if (index >= 0 && index < state.product.images.length) {
    state.product.images.splice(index, 1);
    renderProductMedia();
    showToast("Imagen quitada del producto (sigue en la galería).");
  }
  closeRemoveMediaPrompt();
});

btnDeleteFromDbStorage?.addEventListener('click', async () => {
  if (!pendingMediaRemoval) return;
  const { url, index } = pendingMediaRemoval;

  btnDeleteFromDbStorage.disabled = true;
  btnDeleteFromDbStorage.classList.add('opacity-60', 'pointer-events-none');
  const originalHtml = btnDeleteFromDbStorage.innerHTML;
  btnDeleteFromDbStorage.innerHTML = `
    <div class="w-full flex items-center justify-center py-2 gap-2 text-rose-700">
      <div class="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <span class="text-xs font-bold uppercase tracking-wider">Eliminando de la base de datos...</span>
    </div>
  `;

  try {
    const { error } = await actions.deleteImage({ url });
    if (error) throw error;

    // 1. Quitar de las fotos del producto
    if (index >= 0 && index < state.product.images.length) {
      state.product.images.splice(index, 1);
      renderProductMedia();
    }

    // 2. Si la galería ya estaba cargada en memoria, actualizarla y sincronizar las vistas
    if (state.gallery.images && state.gallery.images.length > 0) {
      state.gallery.images = state.gallery.images.filter(img => img.url !== url);
      renderGalleryFolders();
      renderFilteredGallery();
    }

    showToast("Imagen eliminada definitivamente de la base de datos y de la galería.");
    closeRemoveMediaPrompt();
  } catch (err: any) {
    console.error("Error deleting image from DB/Storage:", err);
    showToast("Error al eliminar la imagen: " + (err.message || err.code || "Error desconocido"), "error");
    btnDeleteFromDbStorage.disabled = false;
    btnDeleteFromDbStorage.classList.remove('opacity-60', 'pointer-events-none');
    btnDeleteFromDbStorage.innerHTML = originalHtml;
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

  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  if (file.type !== 'video/webm' && fileExt !== 'webm') {
    alert('Solo se aceptan videos en formato WebM (.webm). Por favor, comprime o convierte tu video a WebM antes de subirlo.');
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
    const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
    const contentType = 'video/webm';

    // 1. Obtener URL de subida firmada de Firebase Storage
    const { data: urlData, error: urlError } = await actions.getVideoUploadUrl({ fileName, contentType });
    if (urlError || !urlData?.uploadUrl) {
      throw new Error(urlError?.message || 'Error al obtener la URL de subida.');
    }

    // 2. Subida directa binaria a Firebase Storage (evita el límite 413 de Vercel/Payload)
    const uploadRes = await fetch(urlData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Error en la subida a Storage (${uploadRes.status} ${uploadRes.statusText})`);
    }

    // 3. Finalizar y generar enlace con token en Firebase
    const { data: finalData, error: finalError } = await actions.finalizeVideoUpload({ fileName, contentType });
    if (finalError || !finalData?.url) {
      throw new Error(finalError?.message || 'Error al procesar el video subido.');
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
      if (inputId.toLowerCase().includes('hero') || inputId.toLowerCase().includes('slide')) {
        state.gallery.selectedFolder = 'hero';
        state.gallery.currentProductContext = { id: 'hero', slug: 'hero', title: 'Hero Slide' };
      }
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
        <input type="text" placeholder="SKU (Auto)" value="${sku}" class="size-sku w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-lg px-2 py-1 text-3xs font-mono cursor-not-allowed select-none focus:outline-none" readonly title="El SKU de la variante se genera automáticamente de forma fija" required />
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

function renderColorPopoverContent(popoverEl: HTMLElement, card: HTMLElement) {
  const grid = popoverEl.querySelector('.color-list-grid') as HTMLDivElement;
  const searchInput = popoverEl.querySelector('.popover-color-search') as HTMLInputElement;
  if (!grid) return;

  const colorNameInput = card.querySelector('.color-name') as HTMLInputElement;
  const colorHexInput = card.querySelector('.color-hex') as HTMLInputElement;
  const badge = card.querySelector('.color-swatch-badge') as HTMLSpanElement;
  const label = card.querySelector('.color-selected-label') as HTMLSpanElement;

  const currentColorName = (colorNameInput.value || '').trim().toLowerCase();
  const currentColorHex = (colorHexInput.value || '').trim().toLowerCase();

  const allColors = getStoreColors();
  const filterQuery = (searchInput?.value || '').trim().toLowerCase();

  const colors = filterQuery
    ? allColors.filter((c) => c.name.toLowerCase().includes(filterQuery) || c.hex.toLowerCase().includes(filterQuery))
    : allColors;

  grid.innerHTML = '';

  if (colors.length === 0) {
    grid.innerHTML = `
      <div class="py-4 text-center text-slate-400 text-3xs font-medium">
        No se encontraron colores coincidentes
      </div>
    `;
  }

  colors.forEach((col) => {
    const originalIdx = allColors.findIndex((c) => c.name === col.name && c.hex === col.hex);
    const idx = originalIdx >= 0 ? originalIdx : 0;
    const isLight = isLightColor(col.hex);
    const isSelected = currentColorName === col.name.toLowerCase() || currentColorHex === col.hex.toLowerCase();

    const item = document.createElement('div');
    item.className = `group flex flex-col p-2 rounded-xl border transition-all text-left ${
      isSelected 
        ? 'border-rose-500 bg-rose-50/60 shadow-2xs' 
        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/90'
    }`;
    item.innerHTML = `
      <!-- View Mode -->
      <div class="color-item-view flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 overflow-hidden flex-1 select-none cursor-pointer select-color-btn">
          <span class="w-5 h-5 rounded-lg ${isLight ? 'border border-slate-300' : 'border border-black/10'} shrink-0 shadow-3xs flex items-center justify-center transition-transform group-hover:scale-105" style="background-color: ${col.hex}">
            ${isSelected ? `<svg class="w-3 h-3 ${isLight ? 'text-slate-900' : 'text-white'}" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ''}
          </span>
          <div class="flex flex-col overflow-hidden">
            <span class="text-xs font-bold ${isSelected ? 'text-rose-950' : 'text-slate-800'} truncate capitalize">${col.name}</span>
            <span class="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-wider">${col.hex}</span>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" class="edit-color-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer" title="Editar color">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
          <button type="button" class="delete-color-btn opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer" title="Eliminar de la paleta">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Edit Mode -->
      <div class="color-item-edit hidden flex flex-col gap-2 pt-1 border-t border-slate-100">
        <div class="flex gap-2 items-center">
          <input type="color" class="edit-hex-input w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 shrink-0 bg-transparent shadow-3xs" value="${col.hex}" />
          <div class="flex-1 flex flex-col gap-1">
            <input type="text" class="edit-name-input w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-600 focus:bg-white" value="${col.name}" placeholder="Nombre" />
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-mono font-bold text-slate-400">#</span>
              <input type="text" class="edit-hex-text w-full bg-transparent text-[9px] font-mono font-extrabold text-slate-700 uppercase focus:outline-none" value="${col.hex.replace(/^#/, '')}" maxlength="7" />
            </div>
          </div>
        </div>
        <div class="flex justify-end items-center gap-1">
          <button type="button" class="cancel-edit-btn px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-3xs font-bold uppercase transition-colors cursor-pointer">Cancelar</button>
          <button type="button" class="save-edit-btn px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-3xs font-extrabold uppercase transition-colors cursor-pointer">Guardar</button>
        </div>
      </div>
    `;

    const viewMode = item.querySelector('.color-item-view') as HTMLDivElement;
    const editMode = item.querySelector('.color-item-edit') as HTMLDivElement;
    const selectArea = item.querySelector('.select-color-btn') as HTMLDivElement;
    const editBtn = item.querySelector('.edit-color-btn') as HTMLButtonElement;
    const delBtn = item.querySelector('.delete-color-btn') as HTMLButtonElement;
    const saveEditBtn = item.querySelector('.save-edit-btn') as HTMLButtonElement;
    const cancelEditBtn = item.querySelector('.cancel-edit-btn') as HTMLButtonElement;
    const editHexInput = item.querySelector('.edit-hex-input') as HTMLInputElement;
    const editHexText = item.querySelector('.edit-hex-text') as HTMLInputElement;

    // Sync inline edit
    editHexInput?.addEventListener('input', () => {
      if (editHexText) editHexText.value = editHexInput.value.replace(/^#/, '').toUpperCase();
    });

    editHexText?.addEventListener('input', () => {
      const clean = editHexText.value.trim().replace(/^#/, '');
      if (isValidHex(clean)) {
        editHexInput.value = formatHex(clean);
      }
    });

    selectArea.addEventListener('click', () => {
      colorNameInput.value = col.name;
      colorHexInput.value = col.hex;
      if (badge) {
        badge.style.backgroundColor = col.hex;
        badge.className = `color-swatch-badge w-4 h-4 rounded-full ${isLightColor(col.hex) ? 'border border-slate-300' : 'border border-black/10'} shadow-2xs shrink-0`;
      }
      if (label) label.textContent = col.name;

      updateSKUsForBranch(card);
      popoverEl.classList.add('hidden');
    });

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      viewMode.classList.add('hidden');
      editMode.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editMode.classList.add('hidden');
      viewMode.classList.remove('hidden');
    });

    saveEditBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const editNameInput = item.querySelector('.edit-name-input') as HTMLInputElement;
      const newName = editNameInput.value.trim();
      const rawHex = editHexText?.value.trim() || editHexInput?.value;
      const newHex = formatHex(rawHex, col.hex);

      if (!newName) {
        showToast('El nombre del color no puede estar vacío', 'error');
        return;
      }

      const updatedColors = [...allColors];
      updatedColors[idx] = { name: newName, hex: newHex };
      setStoreColors(updatedColors);

      if (colorNameInput.value.toLowerCase() === col.name.toLowerCase()) {
        colorNameInput.value = newName;
        colorHexInput.value = newHex;
        if (badge) {
          badge.style.backgroundColor = newHex;
          badge.className = `color-swatch-badge w-4 h-4 rounded-full ${isLightColor(newHex) ? 'border border-slate-300' : 'border border-black/10'} shadow-2xs shrink-0`;
        }
        if (label) label.textContent = newName;
        updateSKUsForBranch(card);
      }

      renderColorPopoverContent(popoverEl, card);

      try {
        await actions.updateStoreColors({ savedColors: updatedColors });
        showToast(`Color "${newName}" actualizado`, 'success');
      } catch (err) {
        console.error('Error al guardar edición de color:', err);
      }
    });

    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const updatedColors = allColors.filter((_, i) => i !== idx);
      setStoreColors(updatedColors);
      renderColorPopoverContent(popoverEl, card);

      try {
        await actions.updateStoreColors({ savedColors: updatedColors });
        showToast(`Color "${col.name}" eliminado de la paleta`, 'success');
      } catch (err) {
        console.error('Error al actualizar colores guardados:', err);
      }
    });

    grid.appendChild(item);
  });
}

function addColorBranch(colorName = '', colorHex = '#0f172a', imageUrl = '', sizes: any[] = []) {
  state.branchIndex++;
  const branchId = `branch-${state.branchIndex}`;
  
  const card = document.createElement('div');
  card.className = 'color-branch border border-slate-200 bg-white p-4 rounded-2xl flex flex-col gap-3 relative shadow-2xs';
  card.id = branchId;

  const resolvedHex = formatHex(colorHex || getColorHex(colorName) || '#0f172a');
  const isLight = isLightColor(resolvedHex);
  
  card.innerHTML = `
    <div class="flex justify-between items-center gap-3 border-b border-slate-100 pb-2">
      <div class="flex items-center gap-2 flex-1 relative">
        <span class="text-3xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Color/Estilo:</span>
        
        <button type="button" class="color-palette-trigger flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 transition-all cursor-pointer text-left shrink-0 shadow-3xs">
          <span class="color-swatch-badge w-4 h-4 rounded-full ${isLight ? 'border border-slate-300' : 'border border-black/10'} shadow-2xs shrink-0" style="background-color: ${resolvedHex}"></span>
          <span class="color-selected-label text-xs font-bold text-slate-800 capitalize">${colorName || 'Seleccionar color'}</span>
          <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
        </button>

        <input type="hidden" value="${colorName}" class="color-name" required />
        <input type="hidden" value="${resolvedHex}" class="color-hex" />

        <!-- Color Palette Popover Dropdown -->
        <div class="color-popover hidden absolute top-full left-0 mt-2 w-84 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 flex flex-col gap-3.5 animate-fade-in max-h-[85vh] overflow-y-auto">
          <!-- Popover Header & Search -->
          <div class="flex flex-col gap-2 border-b border-slate-100 pb-2.5">
            <div class="flex justify-between items-center">
              <span class="text-3xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-600"></span>
                Paleta de Colores
              </span>
              <span class="text-[10px] text-slate-400 font-medium">Elige o crea un color</span>
            </div>
            <div class="relative">
              <input type="text" placeholder="Buscar color en catálogo..." class="popover-color-search w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-600 focus:bg-white" />
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            </div>
          </div>

          <!-- Store Colors List Grid -->
          <div class="color-list-grid max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
          </div>

          <!-- Color Studio / Creator -->
          <div class="border-t border-slate-100 pt-3 flex flex-col gap-3 bg-slate-50/80 -mx-4 -mb-4 p-4 rounded-b-2xl">
            <span class="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
              Personalizar o Crear Color
            </span>

            <div class="grid grid-cols-12 gap-2 items-center">
              <!-- Swatch Preview + Native Picker -->
              <div class="col-span-5 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-3xs">
                <label class="relative cursor-pointer shrink-0 group">
                  <span class="popover-color-swatch-preview w-8 h-8 rounded-lg border border-slate-300 shadow-3xs flex items-center justify-center transition-transform group-hover:scale-105" style="background-color: #db2777;">
                    <svg class="w-3.5 h-3.5 text-white drop-shadow-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 6.257L6.166 4.666M4.5 10.5H2.25"/></svg>
                  </span>
                  <input type="color" class="new-color-hex sr-only" value="#db2777" title="Elige color" />
                </label>
                <div class="flex flex-col min-w-0 flex-1">
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">HEX</span>
                  <div class="flex items-center gap-0.5">
                    <span class="text-3xs font-mono font-bold text-slate-400">#</span>
                    <input type="text" class="new-color-hex-text w-full bg-transparent text-3xs font-mono font-extrabold text-slate-800 uppercase focus:outline-none" value="DB2777" maxlength="7" />
                  </div>
                </div>
              </div>

              <!-- Name Input -->
              <div class="col-span-7 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-3xs flex flex-col justify-center">
                <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">Nombre</span>
                <input type="text" class="new-color-name w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:text-rose-600" placeholder="Ej: Verde Menta" />
              </div>
            </div>

            <!-- Quick Presets -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Presets rápidos:</span>
              <div class="popover-quick-presets flex flex-wrap gap-1">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button type="button" class="apply-color-only-btn py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-3xs font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-3xs active:scale-95 text-center">
                Aplicar a Variante
              </button>
              <button type="button" class="add-new-color-btn py-2 px-2.5 bg-slate-950 hover:bg-rose-600 text-white rounded-xl text-3xs font-extrabold uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-3xs active:scale-95 text-center">
                + Guardar y Aplicar
              </button>
            </div>
          </div>
        </div>
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
  const badge = card.querySelector('.color-swatch-badge') as HTMLSpanElement;
  const label = card.querySelector('.color-selected-label') as HTMLSpanElement;

  const popover = card.querySelector('.color-popover') as HTMLDivElement;
  const trigger = card.querySelector('.color-palette-trigger') as HTMLButtonElement;
  const searchInput = card.querySelector('.popover-color-search') as HTMLInputElement;
  const newColorNameInput = card.querySelector('.new-color-name') as HTMLInputElement;
  const newColorHexInput = card.querySelector('.new-color-hex') as HTMLInputElement;
  const newColorHexTextInput = card.querySelector('.new-color-hex-text') as HTMLInputElement;
  const popoverSwatchPreview = card.querySelector('.popover-color-swatch-preview') as HTMLSpanElement;
  const popoverPresetsContainer = card.querySelector('.popover-quick-presets') as HTMLDivElement;
  const applyColorOnlyBtn = card.querySelector('.apply-color-only-btn') as HTMLButtonElement;
  const addNewColorBtn = card.querySelector('.add-new-color-btn') as HTMLButtonElement;

  // Render quick preset chips in popover
  if (popoverPresetsContainer) {
    popoverPresetsContainer.innerHTML = '';
    presetFitnessColors.slice(0, 10).forEach((p) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 hover:border-slate-400 text-[9px] font-bold text-slate-700 cursor-pointer shadow-3xs active:scale-95';
      const isLgt = isLightColor(p.hex);
      chip.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full ${isLgt ? 'border border-slate-300' : 'border border-black/10'} shrink-0" style="background-color: ${p.hex}"></span>
        <span class="truncate">${p.name.split('/')[0].trim()}</span>
      `;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (newColorHexInput) newColorHexInput.value = p.hex;
        if (newColorHexTextInput) newColorHexTextInput.value = p.hex.replace(/^#/, '').toUpperCase();
        if (newColorNameInput) newColorNameInput.value = p.name.split('/')[0].trim();
        if (popoverSwatchPreview) popoverSwatchPreview.style.backgroundColor = p.hex;
      });
      popoverPresetsContainer.appendChild(chip);
    });
  }

  // Live sync color picker & hex input in popover
  newColorHexInput?.addEventListener('input', () => {
    const hex = newColorHexInput.value;
    if (newColorHexTextInput) newColorHexTextInput.value = hex.replace(/^#/, '').toUpperCase();
    if (popoverSwatchPreview) popoverSwatchPreview.style.backgroundColor = hex;
  });

  newColorHexTextInput?.addEventListener('input', () => {
    const clean = newColorHexTextInput.value.trim().replace(/^#/, '');
    if (isValidHex(clean)) {
      const formatted = formatHex(clean);
      if (newColorHexInput) newColorHexInput.value = formatted;
      if (popoverSwatchPreview) popoverSwatchPreview.style.backgroundColor = formatted;
    }
  });

  // Auto suggest on typing name
  newColorNameInput?.addEventListener('input', () => {
    const name = newColorNameInput.value.trim();
    if (name.length >= 3) {
      const guessed = getColorHex(name);
      if (guessed && guessed !== '#64748b' && (!newColorHexTextInput?.value || newColorHexTextInput.value === 'DB2777')) {
        if (newColorHexInput) newColorHexInput.value = guessed;
        if (newColorHexTextInput) newColorHexTextInput.value = guessed.replace(/^#/, '').toUpperCase();
        if (popoverSwatchPreview) popoverSwatchPreview.style.backgroundColor = guessed;
      }
    }
  });

  // Search filter in popover
  searchInput?.addEventListener('input', () => {
    renderColorPopoverContent(popover, card);
  });

  // Toggle popover
  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = popover.classList.contains('hidden');
    document.querySelectorAll('.color-popover').forEach((p) => p.classList.add('hidden'));
    if (isHidden) {
      renderColorPopoverContent(popover, card);
      popover.classList.remove('hidden');
    }
  });

  // Close popover when clicking outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (popover && !popover.contains(target) && trigger && !trigger.contains(target)) {
      popover.classList.add('hidden');
    }
  });

  // Helper to apply custom color to this branch
  const applyColorToBranch = (name: string, hex: string) => {
    colorNameInput.value = name;
    colorHexInput.value = hex;
    if (badge) {
      badge.style.backgroundColor = hex;
      badge.className = `color-swatch-badge w-4 h-4 rounded-full ${isLightColor(hex) ? 'border border-slate-300' : 'border border-black/10'} shadow-2xs shrink-0`;
    }
    if (label) label.textContent = name;

    updateSKUsForBranch(card);
    popover.classList.add('hidden');
  };

  // 1. Apply to variant only
  applyColorOnlyBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = newColorNameInput.value.trim();
    const hexRaw = newColorHexTextInput?.value.trim() || newColorHexInput?.value || '#0f172a';
    const hex = formatHex(hexRaw);

    if (!name) {
      showToast('Introduce un nombre para el color', 'error');
      newColorNameInput?.focus();
      return;
    }

    applyColorToBranch(name, hex);
    showToast(`Color "${name}" (${hex}) aplicado a la variante`, 'success');
  });

  // 2. Add new color to palette and apply
  addNewColorBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = newColorNameInput.value.trim();
    const hexRaw = newColorHexTextInput?.value.trim() || newColorHexInput?.value || '#0f172a';
    const hex = formatHex(hexRaw);

    if (!name) {
      showToast('Introduce un nombre para el color', 'error');
      newColorNameInput?.focus();
      return;
    }

    const currentColors = getStoreColors();
    const existingIdx = currentColors.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
    let updatedColors: Array<{ name: string; hex: string }>;
    if (existingIdx >= 0) {
      updatedColors = [...currentColors];
      updatedColors[existingIdx] = { name, hex };
    } else {
      updatedColors = [...currentColors, { name, hex }];
    }

    setStoreColors(updatedColors);
    applyColorToBranch(name, hex);
    newColorNameInput.value = '';

    showToast(`Color "${name}" (${hex}) guardado en la paleta y aplicado`, 'success');

    try {
      await actions.updateStoreColors({ savedColors: updatedColors });
    } catch (err) {
      console.error('Error al guardar el nuevo color en Firestore:', err);
    }
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
    updateAllSKUs();
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
    
    state.gallery.currentProductContext = {
      id: productData.id,
      slug: productData.slug,
      title: productData.title,
    };
    state.gallery.selectedFolder = productData.slug || 'all';

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

      const initialCollectionIds = dbCollections
        .filter((col: any) => col.slug !== 'hombre' && col.slug !== 'mujer' && (col.productIds || []).includes(targetProductId))
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

export function getCollectionConflictMap(currentColId: string | null) {
  const categorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;
  const parentCategory = categorySelect ? categorySelect.value : 'General';
  const isPortada = parentCategory === 'Portada';

  const dbCollections = getDbCollections() || [];
  const otherCols = dbCollections.filter((c: any) => c.id !== currentColId && c.slug !== 'hombre' && c.slug !== 'mujer');

  const conflictMap = new Map<string, { scope: string; collectionTitle: string }>();

  if (parentCategory === 'Hombre') {
    // 1. Any product belonging to other Hombre collections
    const hombreCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Hombre');
    for (const c of hombreCols) {
      for (const pid of (c.productIds || [])) {
        conflictMap.set(pid, { scope: 'Hombre', collectionTitle: c.title });
      }
    }

    // 2. Any product belonging to Mujer collections (including root mujer collection)
    const mujerCols = dbCollections.filter((c: any) => getCollectionCategory(c) === 'Mujer' || c.slug === 'mujer');
    for (const c of mujerCols) {
      for (const pid of (c.productIds || [])) {
        if (!conflictMap.has(pid)) {
          conflictMap.set(pid, { scope: 'Mujer', collectionTitle: c.title });
        }
      }
    }

    // 3. Any product whose inherent gender is Mujer (or whose title / SKU specifies mujer)
    allProducts.forEach((p) => {
      const isWomanProduct = p.gender === 'mujer' || 
                             p.title.toLowerCase().includes('mujer') || 
                             p.title.toLowerCase().includes('women') || 
                             p.sku.toUpperCase().includes('MUJER');
      if (isWomanProduct && !conflictMap.has(p.id)) {
        conflictMap.set(p.id, { scope: 'Mujer', collectionTitle: 'Catálogo Mujer' });
      }
    });

  } else if (parentCategory === 'Mujer') {
    // 1. Any product belonging to other Mujer collections
    const mujerCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Mujer');
    for (const c of mujerCols) {
      for (const pid of (c.productIds || [])) {
        conflictMap.set(pid, { scope: 'Mujer', collectionTitle: c.title });
      }
    }

    // 2. Any product belonging to Hombre collections (including root hombre collection)
    const hombreCols = dbCollections.filter((c: any) => getCollectionCategory(c) === 'Hombre' || c.slug === 'hombre');
    for (const c of hombreCols) {
      for (const pid of (c.productIds || [])) {
        if (!conflictMap.has(pid)) {
          conflictMap.set(pid, { scope: 'Hombre', collectionTitle: c.title });
        }
      }
    }

    // 3. Any product whose inherent gender is Hombre (or whose title / SKU specifies hombre)
    allProducts.forEach((p) => {
      const isManProduct = p.gender === 'hombre' || 
                           p.title.toLowerCase().includes('hombre') || 
                           p.title.toLowerCase().includes('men') || 
                           p.sku.toUpperCase().includes('HOMBRE');
      if (isManProduct && !conflictMap.has(p.id)) {
        conflictMap.set(p.id, { scope: 'Hombre', collectionTitle: 'Catálogo Hombre' });
      }
    });
  }

  if (isPortada) {
    const portadaCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Portada');
    for (const c of portadaCols) {
      for (const pid of (c.productIds || [])) {
        if (!conflictMap.has(pid)) {
          conflictMap.set(pid, { scope: 'Portada', collectionTitle: c.title });
        }
      }
    }
  }

  return conflictMap;
}

export function getCategoryConflictForCollection(colId: string | null, targetCat: string, productIds: string[]): { hasConflict: boolean; reason: string } {
  if (!productIds || productIds.length === 0) {
    return { hasConflict: false, reason: '' };
  }

  const dbCollections = getDbCollections() || [];
  const otherCols = dbCollections.filter((c: any) => c.id !== colId && c.slug !== 'hombre' && c.slug !== 'mujer');
  const productsInCollection = productIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);

  if (targetCat === 'Hombre') {
    const womanProduct = productsInCollection.find(p => p?.gender === 'mujer' || p?.title.toLowerCase().includes('mujer') || p?.sku.toUpperCase().includes('MUJER'));
    if (womanProduct) {
      return { hasConflict: true, reason: `Contiene productos de Mujer ("${womanProduct.title}")` };
    }

    const hombreCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Hombre');
    for (const c of hombreCols) {
      const dup = (c.productIds || []).find((pid: string) => productIds.includes(pid));
      if (dup) {
        const pMeta = allProducts.find(p => p.id === dup);
        return { hasConflict: true, reason: `"${pMeta?.title || dup}" ya pertenece a otra colección de Hombre ("${c.title}")` };
      }
    }

    const mujerCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Mujer');
    for (const c of mujerCols) {
      const dup = (c.productIds || []).find((pid: string) => productIds.includes(pid));
      if (dup) {
        const pMeta = allProducts.find(p => p.id === dup);
        return { hasConflict: true, reason: `"${pMeta?.title || dup}" ya está asignado a Mujer ("${c.title}")` };
      }
    }
  }

  if (targetCat === 'Mujer') {
    const manProduct = productsInCollection.find(p => p?.gender === 'hombre' || p?.title.toLowerCase().includes('hombre') || p?.sku.toUpperCase().includes('HOMBRE'));
    if (manProduct) {
      return { hasConflict: true, reason: `Contiene productos de Hombre ("${manProduct.title}")` };
    }

    const mujerCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Mujer');
    for (const c of mujerCols) {
      const dup = (c.productIds || []).find((pid: string) => productIds.includes(pid));
      if (dup) {
        const pMeta = allProducts.find(p => p.id === dup);
        return { hasConflict: true, reason: `"${pMeta?.title || dup}" ya pertenece a otra colección de Mujer ("${c.title}")` };
      }
    }

    const hombreCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Hombre');
    for (const c of hombreCols) {
      const dup = (c.productIds || []).find((pid: string) => productIds.includes(pid));
      if (dup) {
        const pMeta = allProducts.find(p => p.id === dup);
        return { hasConflict: true, reason: `"${pMeta?.title || dup}" ya está asignado a Hombre ("${c.title}")` };
      }
    }
  }

  if (targetCat === 'Portada') {
    const portadaCols = otherCols.filter((c: any) => getCollectionCategory(c) === 'Portada');
    for (const c of portadaCols) {
      const dup = (c.productIds || []).find((pid: string) => productIds.includes(pid));
      if (dup) {
        const pMeta = allProducts.find(p => p.id === dup);
        return { hasConflict: true, reason: `"${pMeta?.title || dup}" ya se muestra en Portada ("${c.title}")` };
      }
    }
  }

  return { hasConflict: false, reason: '' };
}

let lastValidParentCategory = 'General';

export function syncParentCategoryRestrictions() {
  const categorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;
  const conflictNote = document.getElementById('collection-category-conflict-note');
  if (!categorySelect) return;

  const currentColId = (document.getElementById('form-collection-id') as HTMLInputElement)?.value || null;
  const currentProductIds = state.collection.currentOpenedFolderIds || [];

  const baseLabels: Record<string, string> = {
    'General': 'General (Colección Libre / Mega Menú)',
    'Hombre': 'Hombre (Subcolección de Hombre)',
    'Mujer': 'Mujer (Subcolección de Mujer)',
    'Portada': 'Portada (Página de Inicio)',
    'F3 Synergies': 'F3 Synergies (Alianzas / Gimnasios)'
  };

  const currentVal = categorySelect.value;
  let activeConflictReason = '';

  Array.from(categorySelect.options).forEach((opt) => {
    const catVal = opt.value;
    const baseText = baseLabels[catVal] || catVal;
    const check = getCategoryConflictForCollection(currentColId, catVal, currentProductIds);

    if (check.hasConflict) {
      opt.disabled = true;
      opt.textContent = `${baseText} 🚫 (${check.reason})`;
      if (catVal === currentVal) {
        activeConflictReason = check.reason;
      }
    } else {
      opt.disabled = false;
      opt.textContent = baseText;
    }
  });

  if (conflictNote) {
    if (activeConflictReason) {
      conflictNote.classList.remove('hidden');
      conflictNote.innerHTML = `
        <div class="flex items-start gap-2.5 text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] font-semibold select-none animate-fade-in">
          <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <div class="flex flex-col gap-0.5">
            <span class="font-extrabold uppercase tracking-wider text-[9px] text-amber-800">Categoría no permitida por duplicados</span>
            <span>Esta colección contiene productos en conflicto con <strong>${currentVal}</strong> (${activeConflictReason}). Selecciona <em>General</em> o quita los productos repetidos en la pestaña "2. Organizar Productos".</span>
          </div>
        </div>
      `;
    } else {
      conflictNote.classList.add('hidden');
      conflictNote.innerHTML = '';
    }
  }
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

  const currentColId = (document.getElementById('form-collection-id') as HTMLInputElement)?.value || null;
  const conflictMap = getCollectionConflictMap(currentColId);

  // Check for duplicate conflicts in current associated items
  const conflictingCurrent = associatedIds.filter(id => conflictMap.has(id));
  const collConflictAlert = document.getElementById('coll-conflict-alert');
  const collConflictAlertText = document.getElementById('coll-conflict-alert-text');
  if (collConflictAlert && collConflictAlertText) {
    if (conflictingCurrent.length > 0) {
      collConflictAlert.classList.remove('hidden');
      const details = conflictingCurrent.slice(0, 2).map(id => {
        const p = getProductMeta(id);
        const conf = conflictMap.get(id);
        return `"${p?.title || id}" (en ${conf?.scope}: ${conf?.collectionTitle})`;
      }).join(', ');
      collConflictAlertText.textContent = `Atención: Hay ${conflictingCurrent.length} producto(s) en conflicto (${details}). No se permiten duplicados en este ámbito. Quítalos antes de guardar.`;
    } else {
      collConflictAlert.classList.add('hidden');
    }
  }

  associatedIds.forEach((id, index) => {
    const p = getProductMeta(id);
    if (!p) return;
    const conflict = conflictMap.get(p.id);

    const item = document.createElement('div');
    item.className = `flex items-center gap-3 p-2.5 rounded-xl border ${
      conflict ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'
    } hover:border-slate-355 shadow-3xs cursor-grab active:cursor-grabbing transition-all select-none`;
    item.draggable = true;
    item.dataset.id = p.id;
    item.dataset.index = String(index);

    item.innerHTML = `
      <div class="flex items-center justify-center w-5 h-5 rounded-full ${
        conflict ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-200'
      } font-mono text-[9px] font-bold shrink-0 border">
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
          ${conflict ? `
            <span class="px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider bg-amber-100 text-amber-800 border border-amber-300" title="Conflicto con ${conflict.collectionTitle}">
              ⚠️ Duplicado en ${conflict.scope}
            </span>
          ` : ''}
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
      const conflict = conflictMap.get(p.id);
      const isConflicting = !!conflict;

      const item = document.createElement('div');
      item.className = `flex items-center gap-3 p-2.5 rounded-xl border transition-all select-none ${
        isConflicting 
          ? 'border-amber-200/60 bg-amber-50/20 opacity-60 cursor-not-allowed'
          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white cursor-grab active:cursor-grabbing'
      }`;
      item.draggable = !isConflicting;
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
        ${
          isConflicting
            ? `<span class="text-3xs font-black uppercase px-2 py-1 rounded-lg border border-amber-200 bg-amber-100 text-amber-800 shrink-0 tracking-wider" title="Ya en uso en ${conflict?.collectionTitle} (${conflict?.scope})">En uso (${conflict?.scope})</span>`
            : `<button 
                type="button" 
                class="add-assoc-btn text-2xs font-extrabold uppercase px-2.5 py-1.5 rounded-lg border border-rose-600 bg-rose-600 hover:bg-red-700 text-white shadow-3xs transition-all active:scale-95 shrink-0"
              >
                Añadir
              </button>`
        }
      `;

      if (!isConflicting) {
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
      }

      availableListEl.appendChild(item);
    });
  }

  syncParentCategoryRestrictions();
}

collCatalogSearch?.addEventListener('input', () => {
  populateFolderProducts(state.collection.currentOpenedFolderIds);
});

const collectionParentCategorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;

collectionParentCategorySelect?.addEventListener('change', () => {
  const nextVal = collectionParentCategorySelect.value;
  const currentColId = (document.getElementById('form-collection-id') as HTMLInputElement)?.value || null;
  const currentProductIds = state.collection.currentOpenedFolderIds || [];

  const check = getCategoryConflictForCollection(currentColId, nextVal, currentProductIds);
  if (check.hasConflict) {
    showToast(`Categoría no permitida: ${check.reason}.`, "error");
    collectionParentCategorySelect.value = lastValidParentCategory;
    syncParentCategoryRestrictions();
    return;
  }

  lastValidParentCategory = nextVal;
  populateFolderProducts(state.collection.currentOpenedFolderIds);
  syncParentCategoryRestrictions();
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
    const currentColId = (document.getElementById('form-collection-id') as HTMLInputElement)?.value || null;
    const conflictMap = getCollectionConflictMap(currentColId);
    if (conflictMap.has(productId)) {
      const conflict = conflictMap.get(productId);
      showToast(`No se puede añadir: el producto ya está en "${conflict?.collectionTitle}" (${conflict?.scope}).`, "error");
      return;
    }

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

let currentEditingIndexOrder = 0;

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
  currentEditingIndexOrder = 0;
  deleteCurrentCollectionBtn?.classList.add('hidden');
  const modalViewLink = document.getElementById('modal-view-collection-link') as HTMLAnchorElement;
  if (modalViewLink) modalViewLink.classList.add('hidden');
  if (collCatalogSearch) collCatalogSearch.value = "";

  const categoryWrapper = document.getElementById('collection-category-wrapper');
  const categorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;
  if (categoryWrapper) categoryWrapper.classList.remove('hidden');
  if (collTabProducts) collTabProducts.classList.remove('hidden');
  if (categorySelect) categorySelect.value = 'General';
  lastValidParentCategory = 'General';
  const collConflictAlert = document.getElementById('coll-conflict-alert');
  if (collConflictAlert) collConflictAlert.classList.add('hidden');
  
  switchCollectionTab('info');
  state.collection.currentOpenedFolderIds = [];
  populateFolderProducts(state.collection.currentOpenedFolderIds);
  syncParentCategoryRestrictions();

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

  // Validate conflicts before submitting
  const conflictMap = getCollectionConflictMap(idVal || null);
  const conflicting = state.collection.currentOpenedFolderIds.filter((id) => conflictMap.has(id));
  if (conflicting.length > 0) {
    showToast(`No se puede guardar: hay ${conflicting.length} producto(s) en conflicto que ya existen en otra colección de este ámbito.`, "error");
    saveCollectionBtn.disabled = false;
    saveCollectionBtn.innerHTML = originalBtnText;
    return;
  }

  syncCollectionFormToState(state.collection.activeLang);

  const parentCategorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;
  const parentCategoryVal = parentCategorySelect ? parentCategorySelect.value : 'General';

  const catCheck = getCategoryConflictForCollection(idVal || null, parentCategoryVal, state.collection.currentOpenedFolderIds);
  if (catCheck.hasConflict) {
    showToast(`No se puede guardar en la categoría "${parentCategoryVal}": ${catCheck.reason}.`, "error");
    saveCollectionBtn.disabled = false;
    saveCollectionBtn.innerHTML = originalBtnText;
    return;
  }

  const showOnIndex = (parentCategoryVal === 'Portada');
  const isSynergy = (parentCategoryVal === 'F3 Synergies');
  const indexOrder = (parentCategoryVal === 'Portada') ? currentEditingIndexOrder : 0;

  const collectionPayload: any = {
    title: state.collection.translations.title,
    title_en: state.collection.translations.title_en || undefined,
    slug: slugVal,
    description: state.collection.translations.description,
    description_en: state.collection.translations.description_en || undefined,
    detailedDescription: state.collection.translations.detailedDescription || null,
    detailedDescription_en: state.collection.translations.detailedDescription_en || null,
    productIds: state.collection.currentOpenedFolderIds,
    parentCategory: parentCategoryVal,
    showOnIndex,
    indexOrder,
    isSynergy,
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

// Edit Collection via Folder click
document.querySelectorAll('.collection-folder').forEach((folder) => {
  folder.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.view-collection-link')) {
      return;
    }
    const htmlEl = folder as HTMLDivElement;
    const colData = JSON.parse(htmlEl.dataset.collectionJson || '{}');

    collectionModalTitle.textContent = "Propiedades: Carpeta " + colData.title;
    (document.getElementById('form-collection-id') as HTMLInputElement).value = colData.id;
    (document.getElementById('form-collection-slug') as HTMLInputElement).value = colData.slug;
    currentEditingIndexOrder = colData.indexOrder !== undefined ? colData.indexOrder : 0;

    const modalViewLink = document.getElementById('modal-view-collection-link') as HTMLAnchorElement;
    if (modalViewLink) {
      modalViewLink.href = `/es/colecciones/${colData.slug}`;
      modalViewLink.classList.remove('hidden');
    }

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

    const isFixedRoot = colData.slug === 'hombre' || colData.slug === 'mujer';
    const categoryWrapper = document.getElementById('collection-category-wrapper');
    const categorySelect = document.getElementById('form-collection-parent-category') as HTMLSelectElement | null;

    if (categoryWrapper) {
      if (isFixedRoot) categoryWrapper.classList.add('hidden');
      else categoryWrapper.classList.remove('hidden');
    }

    if (categorySelect) {
      if (isFixedRoot) {
        categorySelect.value = 'General';
        lastValidParentCategory = 'General';
      } else {
        const isMen = colData.slug.includes('hombre') || colData.title?.toLowerCase().includes('hombre') || colData.title?.toLowerCase().includes('men');
        const isWomen = colData.slug.includes('mujer') || colData.title?.toLowerCase().includes('mujer') || colData.title?.toLowerCase().includes('women');
        const detected = colData.parentCategory || (colData.isSynergy ? 'F3 Synergies' : colData.showOnIndex ? 'Portada' : isMen ? 'Hombre' : isWomen ? 'Mujer' : 'General');
        
        let hasOption = Array.from(categorySelect.options).some(opt => opt.value === detected);
        if (!hasOption) {
          const opt = document.createElement('option');
          opt.value = detected;
          opt.textContent = detected;
          categorySelect.appendChild(opt);
        }
        categorySelect.value = detected;
        lastValidParentCategory = detected;
      }
    }

    if (deleteCurrentCollectionBtn) {
      if (isFixedRoot) {
        deleteCurrentCollectionBtn.classList.add('hidden');
      } else {
        deleteCurrentCollectionBtn.classList.remove('hidden');
      }
      deleteCurrentCollectionBtn.dataset.collectionId = colData.id;
      deleteCurrentCollectionBtn.dataset.collectionTitle = colData.title;
    }

    const slugInput = document.getElementById('form-collection-slug') as HTMLInputElement;
    if (slugInput) {
      if (isFixedRoot) {
        slugInput.readOnly = true;
        slugInput.classList.add('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
      } else {
        slugInput.readOnly = false;
        slugInput.classList.remove('bg-slate-50', 'text-slate-400', 'cursor-not-allowed');
      }
    }

    if (collTabProducts) {
      if (isFixedRoot) {
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

let activeDraggedCatalogProductId: string | null = null;

// Dragging catalog products to folders on Desktop
document.querySelectorAll('.product-draggable').forEach((card) => {
  card.addEventListener('dragstart', (e) => {
    if (isReorderMode) {
      e.preventDefault();
      return;
    }
    const pid = card.getAttribute('data-id') || '';
    activeDraggedCatalogProductId = pid;
    const dragEvent = e as DragEvent;
    dragEvent.dataTransfer?.setData('text/plain', pid);
    card.classList.add('opacity-40');
  });
  card.addEventListener('dragend', () => {
    activeDraggedCatalogProductId = null;
    card.classList.remove('opacity-40');
  });
});

document.querySelectorAll('.collection-folder').forEach((folder) => {
  folder.addEventListener('dragover', (e) => {
    if (isReorderMode) return;
    e.preventDefault();
    const dragEvent = e as DragEvent;

    if (activeDraggedCatalogProductId) {
      const colData = JSON.parse(folder.getAttribute('data-collection-json') || '{}');
      if (colData.slug === 'hombre' || colData.slug === 'mujer') {
        if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'none';
        folder.classList.remove('bg-amber-500/20', 'scale-105');
        folder.classList.add('border-red-400', 'bg-red-50/20');
        return;
      }
      const targetCat = getCollectionCategory(colData);
      const targetProduct = allProducts.find(p => p.id === activeDraggedCatalogProductId);
      const isWomanProduct = targetProduct ? (targetProduct.gender === 'mujer' || targetProduct.title.toLowerCase().includes('mujer') || targetProduct.sku.toUpperCase().includes('MUJER')) : false;
      const isManProduct = targetProduct ? (targetProduct.gender === 'hombre' || targetProduct.title.toLowerCase().includes('hombre') || targetProduct.sku.toUpperCase().includes('HOMBRE')) : false;

      if ((targetCat === 'Hombre' && isWomanProduct) || (targetCat === 'Mujer' && isManProduct)) {
        if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'none';
        folder.classList.remove('bg-amber-500/20', 'scale-105');
        folder.classList.add('border-red-400', 'bg-red-50/20');
        return;
      }
    }

    if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'copy';
    folder.classList.remove('border-red-400', 'bg-red-50/20');
    folder.classList.add('bg-amber-500/20', 'scale-105');
  });
  
  folder.addEventListener('dragleave', () => {
    if (isReorderMode) return;
    folder.classList.remove('bg-amber-500/20', 'scale-105', 'border-red-400', 'bg-red-50/20');
  });
  
  folder.addEventListener('drop', async (e) => {
    if (isReorderMode) return;
    e.preventDefault();
    folder.classList.remove('bg-amber-500/20', 'scale-105', 'border-red-400', 'bg-red-50/20');
    
    const dragEvent = e as DragEvent;
    const productId = dragEvent.dataTransfer?.getData('text/plain') || activeDraggedCatalogProductId;
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

    // Anti-duplicate validation across scopes
    const dbCollections = getDbCollections() || [];
    const otherCols = dbCollections.filter((c: any) => c.id !== collectionId && c.slug !== 'hombre' && c.slug !== 'mujer');
    const isMenCol = colData.slug.includes('hombre') || colData.title?.toLowerCase().includes('hombre') || colData.title?.toLowerCase().includes('men');
    const isWomenCol = colData.slug.includes('mujer') || colData.title?.toLowerCase().includes('mujer') || colData.title?.toLowerCase().includes('women');
    const targetCat = colData.parentCategory || (colData.isSynergy ? 'F3 Synergies' : colData.showOnIndex ? 'Portada' : isMenCol ? 'Hombre' : isWomenCol ? 'Mujer' : 'General');

    const targetProduct = allProducts.find(p => p.id === productId);
    const isWomanProduct = targetProduct ? (targetProduct.gender === 'mujer' || targetProduct.title.toLowerCase().includes('mujer') || targetProduct.sku.toUpperCase().includes('MUJER')) : false;
    const isManProduct = targetProduct ? (targetProduct.gender === 'hombre' || targetProduct.title.toLowerCase().includes('hombre') || targetProduct.sku.toUpperCase().includes('HOMBRE')) : false;

    if (targetCat === 'Hombre') {
      if (isWomanProduct) {
        showToast(`No se puede añadir: el producto es de Mujer y no puede asignarse a Hombre.`, "error");
        return;
      }
      const conflictCol = otherCols.find((c: any) => (getCollectionCategory(c) === 'Hombre' || getCollectionCategory(c) === 'Mujer') && (c.productIds || []).includes(productId));
      if (conflictCol) {
        showToast(`No se puede añadir: el producto ya está en "${conflictCol.title}".`, "error");
        return;
      }
    } else if (targetCat === 'Mujer') {
      if (isManProduct) {
        showToast(`No se puede añadir: el producto es de Hombre y no puede asignarse a Mujer.`, "error");
        return;
      }
      const conflictCol = otherCols.find((c: any) => (getCollectionCategory(c) === 'Mujer' || getCollectionCategory(c) === 'Hombre') && (c.productIds || []).includes(productId));
      if (conflictCol) {
        showToast(`No se puede añadir: el producto ya está en "${conflictCol.title}".`, "error");
        return;
      }
    }
    if (colData.showOnIndex || targetCat === 'Portada') {
      const conflictCol = otherCols.find((c: any) => (getCollectionCategory(c) === 'Portada') && (c.productIds || []).includes(productId));
      if (conflictCol) {
        showToast(`No se puede añadir: el producto ya está en "${conflictCol.title}" de Portada.`, "error");
        return;
      }
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
    const current = res?.categories || ['Hombre', 'Mujer', 'Portada', 'F3 Synergies'];
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
        let current = res?.categories || ['Hombre', 'Mujer', 'Portada', 'F3 Synergies'];
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

      let portadaBadge = folder.querySelector('.portada-order-badge') as HTMLElement | null;
      let synergyBadge = folder.querySelector('.synergy-order-badge') as HTMLElement | null;
      const titleWrapper = folder.querySelector('.folder-title-wrapper');

      if (catName === 'Portada') {
        if (!portadaBadge && titleWrapper) {
          portadaBadge = document.createElement('span');
          portadaBadge.className = 'portada-order-badge px-1.5 h-5 min-w-[20px] rounded-full bg-rose-600 text-white text-[10px] font-black font-mono flex items-center justify-center shrink-0 shadow-xs border border-rose-500/40 select-none leading-none tracking-tight';
          titleWrapper.appendChild(portadaBadge);
        }
        if (portadaBadge) {
          portadaBadge.textContent = `#${idx}`;
          portadaBadge.style.display = 'inline-flex';
        }
      } else if (portadaBadge) {
        portadaBadge.style.display = 'none';
      }

      if (catName === 'F3 Synergies') {
        if (!synergyBadge && titleWrapper) {
          synergyBadge = document.createElement('span');
          synergyBadge.className = 'synergy-order-badge w-5 h-5 rounded-full bg-slate-950 text-white text-[10.5px] font-black flex items-center justify-center shrink-0 shadow-xs border border-slate-750 select-none leading-none';
          synergyBadge.textContent = 'S';
          titleWrapper.appendChild(synergyBadge);
        }
        if (synergyBadge) {
          synergyBadge.style.display = 'inline-flex';
        }
      } else if (synergyBadge) {
        synergyBadge.style.display = 'none';
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

// Helper to validate folder drop restrictions in real time during dragging and reordering
export function checkReorderFolderConflict(
  draggedFolderId: string,
  targetCategory: string
): { hasConflict: boolean; reason: string } {
  if (!draggedFolderId || !targetCategory) {
    return { hasConflict: false, reason: '' };
  }

  // Intra-category reordering: moving within the same category doesn't introduce new products
  if (currentFolderCategories[draggedFolderId] === targetCategory) {
    return { hasConflict: false, reason: '' };
  }

  // Non-restricted categories (General, F3 Synergies, custom) have no unique product constraints
  if (targetCategory !== 'Hombre' && targetCategory !== 'Mujer' && targetCategory !== 'Portada') {
    return { hasConflict: false, reason: '' };
  }

  const dbCollections = getDbCollections() || [];
  let draggedCol = dbCollections.find((c: any) => c.id === draggedFolderId);
  const folderEl = document.querySelector(`.draggable-folder[data-id="${draggedFolderId}"]`);
  if (!draggedCol && folderEl) {
    try {
      draggedCol = JSON.parse(folderEl.getAttribute('data-collection-json') || '{}');
    } catch {}
  }

  let draggedProductIds: string[] = draggedCol?.productIds || [];
  if (draggedProductIds.length === 0 && folderEl) {
    try {
      const parsed = JSON.parse(folderEl.getAttribute('data-collection-json') || '{}');
      if (Array.isArray(parsed.productIds)) {
        draggedProductIds = parsed.productIds;
      }
    } catch {}
  }

  if (draggedProductIds.length === 0) {
    return { hasConflict: false, reason: '' };
  }

  const allDbProds = getDbProducts() || [];
  const getProdMeta = (pid: string) => {
    return allProducts.find(p => p.id === pid) || allDbProds.find((p: any) => p.id === pid);
  };
  const getProdTitle = (pid: string) => {
    const p = getProdMeta(pid);
    return p?.title || pid;
  };
  const getColTitle = (col: any) => col?.title || 'Colección';

  const draggedProducts = draggedProductIds.map(id => getProdMeta(id)).filter(Boolean);

  const getEffectiveCategory = (c: any): string => {
    if (currentFolderCategories[c.id]) {
      return currentFolderCategories[c.id];
    }
    return getCollectionCategory(c);
  };

  const isHombre = (c: any) => c.slug === 'hombre' || getEffectiveCategory(c) === 'Hombre';
  const isMujer = (c: any) => c.slug === 'mujer' || getEffectiveCategory(c) === 'Mujer';
  const isPortada = (c: any) => getEffectiveCategory(c) === 'Portada';

  if (targetCategory === 'Hombre') {
    // 1. Gender check: cannot contain products of woman
    const womanProduct = draggedProducts.find((p: any) => 
      p?.gender === 'mujer' || 
      p?.title?.toLowerCase().includes('mujer') || 
      p?.sku?.toUpperCase().includes('MUJER')
    );
    if (womanProduct) {
      return { 
        hasConflict: true, 
        reason: `Contiene productos de Mujer ("${womanProduct.title}"). No se puede mover a Hombre.` 
      };
    }

    // 2. Duplicate check within other Hombre collections
    const otherHombreCols = dbCollections.filter((c: any) => 
      c.id !== draggedFolderId && 
      c.slug !== 'hombre' && 
      isHombre(c)
    );
    for (const c of otherHombreCols) {
      const dupId = (c.productIds || []).find((pid: string) => draggedProductIds.includes(pid));
      if (dupId) {
        return { 
          hasConflict: true, 
          reason: `El producto "${getProdTitle(dupId)}" ya pertenece a "${getColTitle(c)}" en Hombre.` 
        };
      }
    }

    // 3. Isolation check against Mujer collections
    const mujerCols = dbCollections.filter((c: any) => 
      c.id !== draggedFolderId && 
      isMujer(c)
    );
    for (const c of mujerCols) {
      const dupId = (c.productIds || []).find((pid: string) => draggedProductIds.includes(pid));
      if (dupId) {
        return { 
          hasConflict: true, 
          reason: `El producto "${getProdTitle(dupId)}" ya está asignado a Mujer ("${getColTitle(c)}"). Un producto no puede estar en Hombre y Mujer a la vez.` 
        };
      }
    }
  }

  if (targetCategory === 'Mujer') {
    // 1. Gender check: cannot contain products of man
    const manProduct = draggedProducts.find((p: any) => 
      p?.gender === 'hombre' || 
      p?.title?.toLowerCase().includes('hombre') || 
      p?.sku?.toUpperCase().includes('HOMBRE')
    );
    if (manProduct) {
      return { 
        hasConflict: true, 
        reason: `Contiene productos de Hombre ("${manProduct.title}"). No se puede mover a Mujer.` 
      };
    }

    // 2. Duplicate check within other Mujer collections
    const otherMujerCols = dbCollections.filter((c: any) => 
      c.id !== draggedFolderId && 
      c.slug !== 'mujer' && 
      isMujer(c)
    );
    for (const c of otherMujerCols) {
      const dupId = (c.productIds || []).find((pid: string) => draggedProductIds.includes(pid));
      if (dupId) {
        return { 
          hasConflict: true, 
          reason: `El producto "${getProdTitle(dupId)}" ya pertenece a "${getColTitle(c)}" en Mujer.` 
        };
      }
    }

    // 3. Isolation check against Hombre collections
    const hombreCols = dbCollections.filter((c: any) => 
      c.id !== draggedFolderId && 
      isHombre(c)
    );
    for (const c of hombreCols) {
      const dupId = (c.productIds || []).find((pid: string) => draggedProductIds.includes(pid));
      if (dupId) {
        return { 
          hasConflict: true, 
          reason: `El producto "${getProdTitle(dupId)}" ya está asignado a Hombre ("${getColTitle(c)}"). Un producto no puede estar en Hombre y Mujer a la vez.` 
        };
      }
    }
  }

  if (targetCategory === 'Portada') {
    // Duplicate check within other Portada collections
    const otherPortadaCols = dbCollections.filter((c: any) => 
      c.id !== draggedFolderId && 
      isPortada(c)
    );
    for (const c of otherPortadaCols) {
      const dupId = (c.productIds || []).find((pid: string) => draggedProductIds.includes(pid));
      if (dupId) {
        return { 
          hasConflict: true, 
          reason: `El producto "${getProdTitle(dupId)}" ya se muestra en Portada ("${getColTitle(c)}"). No se permiten productos repetidos en Portada.` 
        };
      }
    }
  }

  return { hasConflict: false, reason: '' };
}

let activeDraggedFolderId: string | null = null;

// Drag events for folders
document.querySelectorAll('.draggable-folder').forEach((folder) => {
  folder.addEventListener('dragstart', (e) => {
    if (!isReorderMode) {
      e.preventDefault();
      return;
    }
    const folderId = folder.getAttribute('data-id') || '';
    activeDraggedFolderId = folderId;
    const dragEvent = e as DragEvent;
    dragEvent.dataTransfer?.setData('text/folder-id', folderId);
    folder.classList.add('opacity-40');
  });
  
  folder.addEventListener('dragend', () => {
    activeDraggedFolderId = null;
    folder.classList.remove('opacity-40');
    document.querySelectorAll('.dropzone-category').forEach((dz) => {
      dz.classList.remove('bg-slate-100/80', 'border-rose-400', 'bg-red-50/70', 'border-red-400');
    });
    document.querySelectorAll('.draggable-folder').forEach((f) => {
      f.classList.remove('border-rose-500', 'border-t-2', 'border-red-500');
    });
  });

  // Reordering: drag over another folder to insert before it
  folder.addEventListener('dragover', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    const dragEvent = e as DragEvent;

    const targetDropzone = folder.closest('.dropzone-category') as HTMLElement | null;
    const targetCategory = targetDropzone?.dataset.category || 'General';

    const draggedId = activeDraggedFolderId;
    if (draggedId && draggedId !== folder.getAttribute('data-id')) {
      const conflict = checkReorderFolderConflict(draggedId, targetCategory);
      if (conflict.hasConflict) {
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.dropEffect = 'none';
        }
        folder.classList.remove('border-rose-500');
        folder.classList.add('border-red-500', 'border-t-2');
        return;
      }
    }

    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.dropEffect = 'move';
    }
    folder.classList.remove('border-red-500');
    folder.classList.add('border-rose-500', 'border-t-2');
  });

  folder.addEventListener('dragleave', () => {
    folder.classList.remove('border-rose-500', 'border-red-500', 'border-t-2');
  });

  folder.addEventListener('drop', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    e.stopPropagation();
    folder.classList.remove('border-rose-500', 'border-red-500', 'border-t-2');

    const dragEvent = e as DragEvent;
    const draggedId = dragEvent.dataTransfer?.getData('text/folder-id') || activeDraggedFolderId || '';
    if (!draggedId || draggedId === folder.getAttribute('data-id')) return;

    const targetDropzone = folder.closest('.dropzone-category') as HTMLElement | null;
    const targetCategory = targetDropzone?.dataset.category || 'General';

    const conflict = checkReorderFolderConflict(draggedId, targetCategory);
    if (conflict.hasConflict) {
      showToast(`No se puede mover a "${targetCategory}": ${conflict.reason}`, "error");
      return;
    }

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
    const dragEvent = e as DragEvent;
    const targetCategory = (dropzone as HTMLElement).dataset.category || 'General';

    if (activeDraggedFolderId) {
      const conflict = checkReorderFolderConflict(activeDraggedFolderId, targetCategory);
      if (conflict.hasConflict) {
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.dropEffect = 'none';
        }
        dropzone.classList.remove('bg-slate-100/80', 'border-rose-400');
        dropzone.classList.add('bg-red-50/70', 'border-red-400');
        return;
      }
    }

    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.dropEffect = 'move';
    }
    dropzone.classList.remove('bg-red-50/70', 'border-red-400');
    dropzone.classList.add('bg-slate-100/80', 'border-rose-400');
  });

  dropzone.addEventListener('dragleave', (e) => {
    const related = (e as MouseEvent).relatedTarget as Node | null;
    if (related && (dropzone as HTMLElement).contains(related)) return;
    dropzone.classList.remove('bg-slate-100/80', 'border-rose-400', 'bg-red-50/70', 'border-red-400');
  });

  dropzone.addEventListener('drop', (e) => {
    if (!isReorderMode) return;
    e.preventDefault();
    dropzone.classList.remove('bg-slate-100/80', 'border-rose-400', 'bg-red-50/70', 'border-red-400');
    
    const dragEvent = e as DragEvent;
    const folderId = dragEvent.dataTransfer?.getData('text/folder-id') || activeDraggedFolderId || '';
    const newCategory = (dropzone as HTMLElement).dataset.category || 'General';
    
    if (!folderId || !newCategory) return;

    const conflict = checkReorderFolderConflict(folderId, newCategory);
    if (conflict.hasConflict) {
      showToast(`No se puede mover a "${newCategory}": ${conflict.reason}`, "error");
      return;
    }
    
    // Find the folder element and append it to target grid container
    const folderEl = document.querySelector(`.draggable-folder[data-id="${folderId}"]`);
    const gridContainer = dropzone.querySelector('.grid-cols-2');
    
    if (folderEl && gridContainer) {
      gridContainer.appendChild(folderEl);
      recalculatePositions();
    }
  });
});

// Save Reorder changes in batch
saveReorderBtn?.addEventListener('click', async () => {
  if (!isReorderMode) return;
  
  const dbCollections = getDbCollections() || [];
  const colMap = new Map(dbCollections.map((c: any) => [c.id, c]));

  // Validate duplicate products across restricted scopes (Hombre, Mujer, Portada)
  for (const cat of ['Hombre', 'Mujer', 'Portada']) {
    const seenProducts = new Map<string, string>(); // productId -> collectionTitle
    for (const [id, targetCat] of Object.entries(currentFolderCategories)) {
      if (targetCat === cat) {
        const col = colMap.get(id);
        if (!col) continue;
        for (const pid of (col.productIds || [])) {
          if (seenProducts.has(pid)) {
            const previousTitle = seenProducts.get(pid);
            showToast(`Conflicto al reorganizar: "${col.title}" y "${previousTitle}" comparten un producto en ${cat}. No se permiten duplicados en esta categoría.`, "error");
            return;
          }
          seenProducts.set(pid, col.title);
        }
      }
    }
  }

  const updatePromises = [];
  for (const [id, newCat] of Object.entries(currentFolderCategories)) {
    const oldCat = originalFolderCategories[id];
    const newOrder = currentFolderOrders[id];
    const oldOrder = originalFolderOrders[id];
    
    if (newCat !== oldCat || newOrder !== oldOrder) {
      updatePromises.push(actions.updateCollection({ 
        id, 
        parentCategory: newCat,
        indexOrder: newOrder,
        showOnIndex: newCat === 'Portada' ? true : false,
        isSynergy: newCat === 'F3 Synergies' ? true : false
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
