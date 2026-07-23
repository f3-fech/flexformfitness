import { actions } from 'astro:actions';
import { showToast } from './utils';
import { getDbCollections } from './state';

// Megamenu module global state
let activeMegaMenuTarget: 'col' | 'hombre' | 'mujer' = 'col';
let megaMenuColState: any = null;
let megaMenuHombreState: any = null;
let megaMenuMujerState: any = null;
let subCollectionsHombre: { id: string; title: string }[] = [];
let subCollectionsMujer: { id: string; title: string }[] = [];

// --- DOM Elements ---
const formSubShipping = document.getElementById('form-sub-shipping') as HTMLFormElement;
const formSubBranding = document.getElementById('form-sub-branding') as HTMLFormElement;
const formSubMegamenu = document.getElementById('form-sub-megamenu') as HTMLFormElement;

const presetEuropeBtn = document.getElementById('preset-europe-btn');
const presetNorthAmericaBtn = document.getElementById('preset-northamerica-btn');
const presetClearBtn = document.getElementById('preset-clear-btn');
const countryCheckboxes = document.querySelectorAll('.country-cb') as NodeListOf<HTMLInputElement>;
const settingsOtherMarkets = document.getElementById('settings-other-markets') as HTMLInputElement;

const addAdminBtn = document.getElementById('add-admin-btn');
const newAdminEmailInput = document.getElementById('new-admin-email') as HTMLInputElement;
const adminsContainer = document.getElementById('admins-list-container');

const publishChangesBtn = document.getElementById('publish-changes-btn') as HTMLButtonElement;

// --- 1. Country Selector Presets ---
const europeEU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
const northAmerica = ['US', 'CA', 'MX'];

presetEuropeBtn?.addEventListener('click', () => {
  countryCheckboxes.forEach(cb => {
    if (europeEU.includes(cb.value)) {
      cb.checked = true;
    }
  });
  
  const popularCodes = Array.from(countryCheckboxes).map(cb => cb.value);
  const otherEU = europeEU.filter(code => !popularCodes.includes(code));
  
  const currentOthers = settingsOtherMarkets.value.split(',')
    .map(m => m.trim().toUpperCase())
    .filter(Boolean);
  
  const mergedOthers = Array.from(new Set([...currentOthers, ...otherEU]));
  settingsOtherMarkets.value = mergedOthers.join(', ');
});

presetNorthAmericaBtn?.addEventListener('click', () => {
  countryCheckboxes.forEach(cb => {
    if (northAmerica.includes(cb.value)) {
      cb.checked = true;
    }
  });
});

presetClearBtn?.addEventListener('click', () => {
  countryCheckboxes.forEach(cb => {
    cb.checked = false;
  });
  settingsOtherMarkets.value = '';
});

// --- 2. Admin Delegation Management ---
async function saveAdminsAutomatically() {
  const data = compileSettingsData();
  try {
    const { error } = await actions.updateGeneralSettings(data);
    if (error) throw error;
    markChangesAsPending();
    console.log("Administradores sincronizados con éxito.");
  } catch (err: any) {
    console.error("Error al auto-guardar administradores:", err);
    alert("Error al guardar cambios de administradores: " + (err.message || err.code));
  }
}

addAdminBtn?.addEventListener('click', async () => {
  const email = newAdminEmailInput.value.trim().toLowerCase();
  if (!email) return;
  if (!email.includes('@')) {
    alert('Por favor, introduce un correo electrónico válido.');
    return;
  }

  const existingRows = Array.from(document.querySelectorAll('.admin-row')).map(el => el.getAttribute('data-email'));
  if (existingRows.includes(email)) {
    alert('Este correo ya está registrado como administrador.');
    return;
  }

  const adminRow = document.createElement('div');
  adminRow.className = "flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors admin-row";
  adminRow.setAttribute('data-email', email);
  adminRow.innerHTML = `
    <span class="font-bold text-slate-800 font-mono">${email}</span>
    <button
      type="button"
      class="remove-admin-btn text-rose-500 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition-colors font-bold text-base"
      title="Eliminar administrador"
    >
      ×
    </button>
  `;
  adminsContainer?.appendChild(adminRow);
  newAdminEmailInput.value = '';

  adminRow.querySelector('.remove-admin-btn')?.addEventListener('click', async () => {
    adminRow.remove();
    await saveAdminsAutomatically();
  });

  await saveAdminsAutomatically();
});

document.querySelectorAll('.remove-admin-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const row = (e.currentTarget as HTMLButtonElement).closest('.admin-row');
    row?.remove();
    await saveAdminsAutomatically();
  });
});

// --- 3. Compile Settings Form Data helper ---
function compileSettingsData() {
  const shippingPrice = Math.round(parseFloat((document.getElementById('settings-shipping-price') as HTMLInputElement).value) * 100);
  const freeShippingMin = Math.round(parseFloat((document.getElementById('settings-free-shipping-min') as HTMLInputElement).value) * 100);
  
  const checkedCountries = Array.from(document.querySelectorAll('.country-cb:checked'))
    .map(el => (el as HTMLInputElement).value.trim().toUpperCase());
  
  const otherMarketsInput = (document.getElementById('settings-other-markets') as HTMLInputElement).value;
  const otherCountriesList = otherMarketsInput.split(',')
    .map(m => m.trim().toUpperCase())
    .filter(Boolean);
  
  const markets = Array.from(new Set([...checkedCountries, ...otherCountriesList]));

  const logoUrl = (document.getElementById('settings-logo') as HTMLInputElement).value.trim() || undefined;
  const faviconUrl = (document.getElementById('settings-favicon') as HTMLInputElement).value.trim() || undefined;
  const heroCapsuleCollectionId = (document.getElementById('settings-capsule-collection') as HTMLSelectElement)?.value?.trim() || undefined;
  const admins = Array.from(document.querySelectorAll('.admin-row')).map(el => el.getAttribute('data-email') || '').filter(Boolean);

  // Compile dynamic Hero slides
  const heroSlides: any[] = [];
  const slideCards = document.querySelectorAll('.hero-slide-card');
  slideCards.forEach((card) => {
    const id = card.getAttribute('data-id') || '';
    const desktopType = (card.querySelector('.slide-desktop-type') as HTMLSelectElement).value;
    const desktopUrl = (card.querySelector('.slide-desktop-url') as HTMLInputElement).value.trim();
    const mobileType = (card.querySelector('.slide-mobile-type') as HTMLSelectElement).value;
    const mobileUrl = (card.querySelector('.slide-mobile-url') as HTMLInputElement).value.trim();
    
    const btn1Enabled = (card.querySelector('.slide-btn1-enabled') as HTMLInputElement).checked;
    const btn1Text = (card.querySelector('.slide-btn1-text') as HTMLInputElement).value.trim() || 'Comprar ahora';
    const btn1TextEn = (card.querySelector('.slide-btn1-text-en') as HTMLInputElement).value.trim() || undefined;
    const btn1CollectionId = (card.querySelector('.slide-btn1-collection-id') as HTMLSelectElement).value;
    const btn1Style = (card.querySelector('.slide-btn1-style') as HTMLSelectElement).value as 'primary' | 'secondary';

    const btn2Enabled = (card.querySelector('.slide-btn2-enabled') as HTMLInputElement).checked;
    const btn2Text = (card.querySelector('.slide-btn2-text') as HTMLInputElement).value.trim() || 'Nueva Cápsula';
    const btn2TextEn = (card.querySelector('.slide-btn2-text-en') as HTMLInputElement).value.trim() || undefined;
    const btn2CollectionId = (card.querySelector('.slide-btn2-collection-id') as HTMLSelectElement).value;
    const btn2Style = (card.querySelector('.slide-btn2-style') as HTMLSelectElement).value as 'primary' | 'secondary';

    const showTitleOverlay = (card.querySelector('.slide-show-title') as HTMLInputElement).checked;

    heroSlides.push({
      id,
      desktopType,
      desktopUrl,
      mobileType,
      mobileUrl,
      button1: {
        text: btn1Text,
        textEn: btn1TextEn,
        collectionId: btn1CollectionId,
        style: btn1Style,
        enabled: btn1Enabled,
      },
      button2: {
        text: btn2Text,
        textEn: btn2TextEn,
        collectionId: btn2CollectionId,
        style: btn2Style,
        enabled: btn2Enabled,
      },
      showTitleOverlay
    });
  });

  saveCurrentMegaMenuFormToState();

  return { 
    shippingPrice, 
    freeShippingMin, 
    markets, 
    logoUrl, 
    faviconUrl, 
    heroSlides,
    heroCapsuleCollectionId,
    admins, 
    megaMenu: megaMenuColState || undefined,
    megaMenuHombre: megaMenuHombreState || undefined,
    megaMenuMujer: megaMenuMujerState || undefined
  };
}

// --- 4. Sub-forms submit handlers ---
formSubShipping?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-shipping-btn') as HTMLButtonElement;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Guardando...</span>';

  const data = compileSettingsData();

  try {
    const { error } = await actions.updateGeneralSettings(data);
    if (error) throw error;
    localStorage.setItem('flexform_pending_changes', 'true');
    alert('Configuración de envíos y mercados guardada con éxito.');
    window.location.reload();
  } catch (err: any) {
    console.error(err);
    alert('Error al guardar envíos: ' + (err.message || err.code));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

formSubBranding?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-branding-btn') as HTMLButtonElement;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Guardando...</span>';

  const data = compileSettingsData();

  try {
    const { error } = await actions.updateGeneralSettings(data);
    if (error) throw error;
    localStorage.setItem('flexform_pending_changes', 'true');
    alert('Identidad de marca guardada con éxito.');
    window.location.reload();
  } catch (err: any) {
    console.error(err);
    alert('Error al guardar marca: ' + (err.message || err.code));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

formSubMegamenu?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-megamenu-btn') as HTMLButtonElement;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Guardando...</span>';

  const data = compileSettingsData();

  try {
    const { error } = await actions.updateGeneralSettings(data);
    if (error) throw error;
    localStorage.setItem('flexform_pending_changes', 'true');
    alert('Configuración del menú de colecciones guardada con éxito.');
    window.location.reload();
  } catch (err: any) {
    console.error(err);
    alert('Error al guardar configuración del menú: ' + (err.message || err.code));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// Bind mega menu image previews
const p1ImgInput = document.getElementById('megamenu-p1-image') as HTMLInputElement;
const p1PreviewDiv = document.getElementById('megamenu-p1-preview') as HTMLDivElement;
p1ImgInput?.addEventListener('input', () => {
  const val = p1ImgInput.value.trim();
  if (val) {
    p1PreviewDiv.innerHTML = `<img src="${val}" class="w-full h-full object-cover" />`;
  } else {
    p1PreviewDiv.innerHTML = `<span class="text-[8px] text-slate-400 font-bold uppercase">Vacío</span>`;
  }
});

const p2ImgInput = document.getElementById('megamenu-p2-image') as HTMLInputElement;
const p2PreviewDiv = document.getElementById('megamenu-p2-preview') as HTMLDivElement;
p2ImgInput?.addEventListener('input', () => {
  const val = p2ImgInput.value.trim();
  if (val) {
    p2PreviewDiv.innerHTML = `<img src="${val}" class="w-full h-full object-cover" />`;
  } else {
    p2PreviewDiv.innerHTML = `<span class="text-[8px] text-slate-400 font-bold uppercase">Vacío</span>`;
  }
});

// Coupons free shipping min inputs sync
const fsMin1 = document.getElementById('settings-free-shipping-min') as HTMLInputElement;
const fsMin2 = document.getElementById('settings-coupons-free-shipping-min') as HTMLInputElement;

if (fsMin1 && fsMin2) {
  fsMin1.addEventListener('input', () => { fsMin2.value = fsMin1.value; });
  fsMin2.addEventListener('input', () => { fsMin1.value = fsMin2.value; });
}

const formCouponsFreeShipping = document.getElementById('form-sub-coupons-free-shipping') as HTMLFormElement;
formCouponsFreeShipping?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = formCouponsFreeShipping.querySelector('button[type="submit"]') as HTMLButtonElement;
  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Guardando...';

  const data = compileSettingsData();

  try {
    const { error } = await actions.updateGeneralSettings(data);
    if (error) throw error;
    localStorage.setItem('flexform_pending_changes', 'true');
    alert('Configuración de envío guardada con éxito.');
    window.location.reload();
  } catch (err: any) {
    console.error(err);
    alert('Error al guardar configuración: ' + (err.message || err.code));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// --- 5. Stripe Promo Codes Management ---
const createPromoBtn = document.getElementById('create-promo-btn') as HTMLButtonElement;
const promoCodeNameInput = document.getElementById('promo-code-name') as HTMLInputElement;
const promoCodeTypeSelect = document.getElementById('promo-code-type') as HTMLSelectElement;
const promoCodeValueInput = document.getElementById('promo-code-value') as HTMLInputElement;

createPromoBtn?.addEventListener('click', async () => {
  const code = promoCodeNameInput.value.trim().toUpperCase();
  const discountType = promoCodeTypeSelect.value as 'percent' | 'amount';
  const value = parseFloat(promoCodeValueInput.value);

  if (!code) {
    alert('Por favor, introduce un código de promoción.');
    return;
  }

  if (isNaN(value) || value <= 0) {
    alert('Por favor, introduce un valor de descuento positivo.');
    return;
  }

  createPromoBtn.disabled = true;
  const originalText = createPromoBtn.innerHTML;
  createPromoBtn.innerHTML = '<span>Creando...</span>';

  try {
    const { error } = await actions.createDiscountCode({
      code,
      discountType,
      value,
    });

    if (error) throw error;

    localStorage.setItem('flexform_pending_changes', 'true');
    alert(`Código promocional "${code}" creado con éxito.`);
    window.location.reload();
  } catch (err: any) {
    console.error('Error creating discount code:', err);
    alert('Error al crear el código promocional: ' + (err.message || err.code));
    createPromoBtn.disabled = false;
    createPromoBtn.innerHTML = originalText;
  }
});

document.querySelectorAll('.delete-promo-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const promoId = target.dataset.promoId;
    if (!promoId) return;

    if (confirm('¿Estás seguro de que deseas desactivar este código promocional? Los clientes ya no podrán utilizarlo.')) {
      target.disabled = true;
      const originalContent = target.textContent;
      target.textContent = '...';

      try {
        const { error } = await actions.deactivateDiscountCode({ id: promoId });
        if (error) throw error;

        localStorage.setItem('flexform_pending_changes', 'true');
        alert('Código promocional desactivado.');
        window.location.reload();
      } catch (err: any) {
        console.error('Error deactivating discount code:', err);
        alert('Error al desactivar el código promocional: ' + (err.message || err.code));
        target.disabled = false;
        target.textContent = originalContent;
      }
    }
  });
});

// --- 6. Publish Pending Changes under demand logic ---
function markChangesAsPending() {
  localStorage.setItem('flexform_pending_changes', 'true');
  updatePublishButton();
}

function updatePublishButton() {
  const btn = document.getElementById('publish-changes-btn') as HTMLButtonElement;
  const badge = document.getElementById('publish-badge') as HTMLSpanElement;
  const text = document.getElementById('publish-btn-text') as HTMLSpanElement;
  if (!btn || !badge || !text) return;

  const hasPending = localStorage.getItem('flexform_pending_changes') === 'true';

  if (hasPending) {
    btn.disabled = false;
    btn.className = "px-4 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 text-amber-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-3xs flex items-center gap-2 cursor-pointer";
    badge.className = "w-2 h-2 rounded-full bg-amber-500 animate-pulse";
    text.textContent = "Publicar Cambios";
  } else {
    btn.disabled = true;
    btn.className = "px-4 py-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-3xs flex items-center gap-2 cursor-not-allowed";
    badge.className = "w-2 h-2 rounded-full bg-emerald-500";
    text.textContent = "Publicado";
  }
}

publishChangesBtn?.addEventListener('click', async () => {
  const hasPending = localStorage.getItem('flexform_pending_changes') === 'true';
  if (!hasPending) return;

  if (!confirm('¿Estás seguro de que deseas publicar todos los cambios pendientes? Esto iniciará la reconstrucción de la tienda en Vercel.')) {
    return;
  }

  publishChangesBtn.disabled = true;
  const text = document.getElementById('publish-btn-text') as HTMLSpanElement;
  text.textContent = "Publicando...";

  try {
    const { error } = await actions.publishChanges();
    if (error) throw error;

    localStorage.removeItem('flexform_pending_changes');
    alert('¡Cambios publicados con éxito! Vercel está reconstruyendo la web pública en este momento.');
    updatePublishButton();
  } catch (err: any) {
    console.error(err);
    alert('Error al publicar cambios: ' + (err.message || err.code));
    updatePublishButton();
  }
});

// Initial load check
updatePublishButton();

// --- 5. Megamenu Sortable & Addition Logic ---
let s1SelectedIds: string[] = [];
let s2SelectedIds: string[] = [];
let allCollections: { id: string; title: string }[] = [];

// Drag element helper
function getSettingsDragAfterElement(container: HTMLElement, y: number) {
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

function renderMegamenuList(section: 1 | 2) {
  const listEl = document.getElementById(`megamenu-s${section}-selected-list`);
  if (!listEl) return;

  const isFixedColumn = section === 1 && (activeMegaMenuTarget === 'hombre' || activeMegaMenuTarget === 'mujer');

  const addContainer = document.getElementById(`megamenu-s${section}-dropdown-container`)?.parentElement;
  if (section === 1 && addContainer) {
    if (isFixedColumn) {
      addContainer.classList.add('hidden');
    } else {
      addContainer.classList.remove('hidden');
    }
  }

  if (isFixedColumn) {
    listEl.innerHTML = '';
    const fixedCols = activeMegaMenuTarget === 'hombre' ? subCollectionsHombre : subCollectionsMujer;

    if (fixedCols.length === 0) {
      listEl.innerHTML = `
        <div class="py-4 flex flex-col items-center justify-center text-center text-slate-400 select-none">
          <span class="text-3xs uppercase tracking-wider font-extrabold">Sin categorías automáticas</span>
          <span class="text-[9px]">No hay colecciones asignadas a la categoría de ${activeMegaMenuTarget === 'hombre' ? 'Hombre' : 'Mujer'}</span>
        </div>
      `;
    } else {
      fixedCols.forEach((col: { id: string; title: string }) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/60 select-none';
        item.innerHTML = `
          <span class="text-2xs font-extrabold uppercase text-slate-700 font-mono">${col.title}</span>
          <span class="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
            <svg class="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            Fija (Categoría)
          </span>
        `;
        listEl.appendChild(item);
      });
    }
    return;
  }

  const selectedIds = section === 1 ? s1SelectedIds : s2SelectedIds;

  // Clear list
  listEl.innerHTML = '';

  if (selectedIds.length === 0) {
    listEl.innerHTML = `
      <div class="py-6 flex flex-col items-center justify-center text-center text-slate-400 select-none">
        <span class="text-3xs uppercase tracking-wider font-extrabold">Vacío</span>
        <span class="text-[9px]">Añade categorías para mostrarlas en esta columna</span>
      </div>
    `;
  } else {
    selectedIds.forEach((id, index) => {
      const col = allCollections.find(c => c.id === id);
      if (!col) return;

      const item = document.createElement('div');
      item.className = 'flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 shadow-3xs cursor-grab active:cursor-grabbing select-none group';
      item.draggable = true;
      item.dataset.id = id;
      item.dataset.index = String(index);

      item.innerHTML = `
        <div class="text-slate-400 group-hover:text-slate-600 cursor-grab shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </div>
        <div class="flex-grow text-left">
          <span class="text-2xs font-extrabold uppercase text-slate-700 leading-tight font-mono">${col.title}</span>
        </div>
        <button type="button" class="remove-mega-item-btn w-5 h-5 flex items-center justify-center rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors focus:outline-none text-xs font-bold cursor-pointer">
          ×
        </button>
      `;

      // Remove listener
      item.querySelector('.remove-mega-item-btn')?.addEventListener('click', () => {
        selectedIds.splice(index, 1);
        renderMegamenuList(section);
      });

      // Drag and drop listeners
      item.addEventListener('dragstart', (e) => {
        const dragEvent = e as DragEvent;
        dragEvent.dataTransfer?.setData('text/plain', id);
        dragEvent.dataTransfer?.setData('source-section', String(section));
        dragEvent.dataTransfer?.setData('source-index', String(index));
        item.classList.add('opacity-40');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('opacity-40');
      });

      listEl.appendChild(item);
    });

    // Add dragover listener to listEl for sorting
    listEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragEvent = e as DragEvent;
      const draggingEl = listEl.querySelector('.opacity-40') as HTMLElement;
      if (!draggingEl) return;

      const afterElement = getSettingsDragAfterElement(listEl, dragEvent.clientY);
      if (afterElement == null) {
        listEl.appendChild(draggingEl);
      } else {
        listEl.insertBefore(draggingEl, afterElement);
      }
    });

    listEl.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragEvent = e as DragEvent;
      const sourceSec = parseInt(dragEvent.dataTransfer?.getData('source-section') || '0');
      const sourceIndex = parseInt(dragEvent.dataTransfer?.getData('source-index') || '-1');

      if (sourceSec !== section || sourceIndex === -1) return;

      // Re-read items order from DOM
      const currentItems = Array.from(listEl.querySelectorAll('[draggable="true"]')) as HTMLElement[];
      const newIdsOrder = currentItems.map(item => item.dataset.id || '').filter(Boolean);

      if (section === 1) {
        s1SelectedIds = newIdsOrder;
      } else {
        s2SelectedIds = newIdsOrder;
      }

      renderMegamenuList(section);
    });
  }

  // Populate available list as dropdown items
  const availableContainer = document.getElementById(`megamenu-s${section}-available-list`);
  if (availableContainer) {
    availableContainer.innerHTML = '';
    const availableCols = allCollections.filter(col => !selectedIds.includes(col.id));
    if (availableCols.length === 0) {
      availableContainer.innerHTML = `
        <span class="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider select-none py-3 px-4 text-center">Todas las categorías añadidas</span>
      `;
    } else {
      availableCols.forEach(col => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'text-left px-3.5 py-2 hover:bg-slate-50 text-2xs font-extrabold uppercase text-slate-700 transition-colors cursor-pointer select-none';
        btn.textContent = col.title;
        btn.addEventListener('click', () => {
          selectedIds.push(col.id);
          renderMegamenuList(section);
          // Close the dropdown immediately
          availableContainer.classList.add('hidden');
          const trigger = availableContainer.previousElementSibling as HTMLButtonElement;
          trigger.querySelector('svg')?.classList.remove('rotate-180');
        });
        availableContainer.appendChild(btn);
      });
    }
  }
}

function saveCurrentMegaMenuFormToState() {
  const s1Title = (document.getElementById('megamenu-s1-title') as HTMLInputElement)?.value.trim() || '';
  const s1TitleEn = (document.getElementById('megamenu-s1-title-en') as HTMLInputElement)?.value.trim() || '';
  const s1Collections = [...s1SelectedIds];

  const s2Title = (document.getElementById('megamenu-s2-title') as HTMLInputElement)?.value.trim() || '';
  const s2TitleEn = (document.getElementById('megamenu-s2-title-en') as HTMLInputElement)?.value.trim() || '';
  const s2Collections = [...s2SelectedIds];

  const p1Image = (document.getElementById('megamenu-p1-image') as HTMLInputElement)?.value.trim() || '';
  const p1Title = (document.getElementById('megamenu-p1-title') as HTMLInputElement)?.value.trim() || '';
  const p1TitleEn = (document.getElementById('megamenu-p1-title-en') as HTMLInputElement)?.value.trim() || '';
  const p1Subtitle = (document.getElementById('megamenu-p1-subtitle') as HTMLInputElement)?.value.trim() || '';
  const p1SubtitleEn = (document.getElementById('megamenu-p1-subtitle-en') as HTMLInputElement)?.value.trim() || '';
  const p1Link = (document.getElementById('megamenu-p1-link') as HTMLInputElement)?.value.trim() || '';

  const p2Image = (document.getElementById('megamenu-p2-image') as HTMLInputElement)?.value.trim() || '';
  const p2Title = (document.getElementById('megamenu-p2-title') as HTMLInputElement)?.value.trim() || '';
  const p2TitleEn = (document.getElementById('megamenu-p2-title-en') as HTMLInputElement)?.value.trim() || '';
  const p2Subtitle = (document.getElementById('megamenu-p2-subtitle') as HTMLInputElement)?.value.trim() || '';
  const p2SubtitleEn = (document.getElementById('megamenu-p2-subtitle-en') as HTMLInputElement)?.value.trim() || '';
  const p2Link = (document.getElementById('megamenu-p2-link') as HTMLInputElement)?.value.trim() || '';

  const config = {
    section1: { title: s1Title, titleEn: s1TitleEn, collectionIds: s1Collections },
    section2: { title: s2Title, titleEn: s2TitleEn, collectionIds: s2Collections },
    promo1: { imageUrl: p1Image, title: p1Title, titleEn: p1TitleEn, subtitle: p1Subtitle, subtitleEn: p1SubtitleEn, linkUrl: p1Link },
    promo2: { imageUrl: p2Image, title: p2Title, titleEn: p2TitleEn, subtitle: p2Subtitle, subtitleEn: p2SubtitleEn, linkUrl: p2Link }
  };

  if (activeMegaMenuTarget === 'col') megaMenuColState = config;
  else if (activeMegaMenuTarget === 'hombre') megaMenuHombreState = config;
  else if (activeMegaMenuTarget === 'mujer') megaMenuMujerState = config;
}

function loadMegaMenuTargetForm(target: 'col' | 'hombre' | 'mujer') {
  saveCurrentMegaMenuFormToState();
  activeMegaMenuTarget = target;

  document.querySelectorAll('.megamenu-target-btn').forEach(btn => {
    const bEl = btn as HTMLButtonElement;
    if (bEl.dataset.target === target) {
      bEl.className = "megamenu-target-btn px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-rose-600 text-white shadow-3xs cursor-pointer";
    } else {
      bEl.className = "megamenu-target-btn px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer";
    }
  });

  const config = target === 'col' ? megaMenuColState : target === 'hombre' ? megaMenuHombreState : megaMenuMujerState;

  s1SelectedIds = config?.section1?.collectionIds ? [...config.section1.collectionIds] : [];
  s2SelectedIds = config?.section2?.collectionIds ? [...config.section2.collectionIds] : [];

  const s1TitleInput = document.getElementById('megamenu-s1-title') as HTMLInputElement;
  const s1TitleEnInput = document.getElementById('megamenu-s1-title-en') as HTMLInputElement;
  const s2TitleInput = document.getElementById('megamenu-s2-title') as HTMLInputElement;
  const s2TitleEnInput = document.getElementById('megamenu-s2-title-en') as HTMLInputElement;

  if (target === 'hombre' || target === 'mujer') {
    if (s1TitleInput) {
      s1TitleInput.value = target === 'hombre' ? 'Colección Hombre' : 'Colección Mujer';
      s1TitleInput.disabled = true;
      s1TitleInput.classList.add('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
    }
    if (s1TitleEnInput) {
      s1TitleEnInput.value = target === 'hombre' ? "Men's Collection" : "Women's Collection";
      s1TitleEnInput.disabled = true;
      s1TitleEnInput.classList.add('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
    }
  } else {
    if (s1TitleInput) {
      s1TitleInput.value = config?.section1?.title || 'Nuestras Colecciones';
      s1TitleInput.disabled = false;
      s1TitleInput.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
    }
    if (s1TitleEnInput) {
      s1TitleEnInput.value = config?.section1?.titleEn || 'Our Collections';
      s1TitleEnInput.disabled = false;
      s1TitleEnInput.classList.remove('bg-slate-100', 'text-slate-400', 'cursor-not-allowed');
    }
  }

  if (s2TitleInput) s2TitleInput.value = config?.section2?.title || 'Más Categorías';
  if (s2TitleEnInput) s2TitleEnInput.value = config?.section2?.titleEn || 'More Categories';

  const p1ImageInput = document.getElementById('megamenu-p1-image') as HTMLInputElement;
  const p1TitleInput = document.getElementById('megamenu-p1-title') as HTMLInputElement;
  const p1TitleEnInput = document.getElementById('megamenu-p1-title-en') as HTMLInputElement;
  const p1SubtitleInput = document.getElementById('megamenu-p1-subtitle') as HTMLInputElement;
  const p1SubtitleEnInput = document.getElementById('megamenu-p1-subtitle-en') as HTMLInputElement;
  const p1LinkInput = document.getElementById('megamenu-p1-link') as HTMLInputElement;

  if (p1ImageInput) p1ImageInput.value = config?.promo1?.imageUrl || (target === 'hombre' ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600' : target === 'mujer' ? 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600' : '');
  if (p1TitleInput) p1TitleInput.value = config?.promo1?.title || (target === 'hombre' ? 'Colección Hombre' : target === 'mujer' ? 'Colección Mujer' : '');
  if (p1TitleEnInput) p1TitleEnInput.value = config?.promo1?.titleEn || (target === 'hombre' ? "Men's Collection" : target === 'mujer' ? "Women's Collection" : '');
  if (p1SubtitleInput) p1SubtitleInput.value = config?.promo1?.subtitle || 'Explorar Novedades';
  if (p1SubtitleEnInput) p1SubtitleEnInput.value = config?.promo1?.subtitleEn || 'Explore New';
  if (p1LinkInput) p1LinkInput.value = config?.promo1?.linkUrl || (target === 'hombre' ? 'hombre' : target === 'mujer' ? 'mujer' : '');

  const p2ImageInput = document.getElementById('megamenu-p2-image') as HTMLInputElement;
  const p2TitleInput = document.getElementById('megamenu-p2-title') as HTMLInputElement;
  const p2TitleEnInput = document.getElementById('megamenu-p2-title-en') as HTMLInputElement;
  const p2SubtitleInput = document.getElementById('megamenu-p2-subtitle') as HTMLInputElement;
  const p2SubtitleEnInput = document.getElementById('megamenu-p2-subtitle-en') as HTMLInputElement;
  const p2LinkInput = document.getElementById('megamenu-p2-link') as HTMLInputElement;

  if (p2ImageInput) p2ImageInput.value = config?.promo2?.imageUrl || (target === 'hombre' ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600' : target === 'mujer' ? 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600' : '');
  if (p2TitleInput) p2TitleInput.value = config?.promo2?.title || (target === 'hombre' ? 'Nuevos Drops' : target === 'mujer' ? 'Nuevos Drops' : '');
  if (p2TitleEnInput) p2TitleEnInput.value = config?.promo2?.titleEn || 'New Drops';
  if (p2SubtitleInput) p2SubtitleInput.value = config?.promo2?.subtitle || 'Edición Limitada';
  if (p2SubtitleEnInput) p2SubtitleEnInput.value = config?.promo2?.subtitleEn || 'Limited Edition';
  if (p2LinkInput) p2LinkInput.value = config?.promo2?.linkUrl || (target === 'hombre' ? 'hombre' : target === 'mujer' ? 'mujer' : '');

  p1ImageInput?.dispatchEvent(new Event('input'));
  p2ImageInput?.dispatchEvent(new Event('input'));

  renderMegamenuList(1);
  renderMegamenuList(2);
}

// Initial parsing of megamenu bridge data
const megamenuBridgeEl = document.getElementById('megamenu-initial-bridge');
if (megamenuBridgeEl) {
  megaMenuColState = JSON.parse(megamenuBridgeEl.getAttribute('data-mm-col') || 'null');
  megaMenuHombreState = JSON.parse(megamenuBridgeEl.getAttribute('data-mm-hombre') || 'null');
  megaMenuMujerState = JSON.parse(megamenuBridgeEl.getAttribute('data-mm-mujer') || 'null');
  subCollectionsHombre = JSON.parse(megamenuBridgeEl.getAttribute('data-mm-sub-hombre') || '[]');
  subCollectionsMujer = JSON.parse(megamenuBridgeEl.getAttribute('data-mm-sub-mujer') || '[]');
  allCollections = JSON.parse(megamenuBridgeEl.getAttribute('data-all') || '[]');

  document.querySelectorAll('.megamenu-target-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = (e.currentTarget as HTMLButtonElement).dataset.target as 'col' | 'hombre' | 'mujer';
      if (target && target !== activeMegaMenuTarget) {
        loadMegaMenuTargetForm(target);
      }
    });
  });

  loadMegaMenuTargetForm('col');

  // Setup real-time thumbnail preview updates for Promo 1 & 2
  const setupImagePreview = (inputId: string, previewId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    const update = () => {
      const url = input.value.trim();
      if (url) {
        preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
      } else {
        preview.innerHTML = `<span class="text-3xs text-slate-400 font-extrabold uppercase select-none">No Img</span>`;
      }
    };

    input.addEventListener('input', update);
    input.addEventListener('change', update);
  };

  setupImagePreview('megamenu-p1-image', 'megamenu-p1-preview');
  setupImagePreview('megamenu-p2-image', 'megamenu-p2-preview');

  // Generic Custom Dropdown logic
  const closeAllDropdowns = () => {
    document.querySelectorAll('.custom-dropdown .dropdown-options-list').forEach(list => {
      list.classList.add('hidden');
    });
    document.querySelectorAll('.custom-dropdown button svg').forEach(svg => {
      svg.classList.remove('rotate-180');
    });
  };

  // Toggle dropdown on trigger click
  document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('button');
    const list = dropdown.querySelector('.dropdown-options-list');
    if (!trigger || !list) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyHidden = list.classList.contains('hidden');
      closeAllDropdowns();
      if (isCurrentlyHidden) {
        list.classList.remove('hidden');
        trigger.querySelector('svg')?.classList.add('rotate-180');
      }
    });
  });

  // Handle single-select custom dropdown item clicks
  document.querySelectorAll('.single-select-dropdown').forEach(dropdown => {
    const inputId = dropdown.getAttribute('data-input-id') || '';
    const input = document.getElementById(inputId) as HTMLInputElement;
    const triggerText = dropdown.querySelector('.dropdown-selected-text');
    const optionsList = dropdown.querySelector('.dropdown-options-list');
    if (!input || !triggerText || !optionsList) return;

    optionsList.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.dropdown-option-item') as HTMLButtonElement;
      if (!target) return;

      const val = target.getAttribute('data-value') || '';
      const title = target.getAttribute('data-title') || '';

      // Update hidden input and trigger text
      input.value = val;
      input.dispatchEvent(new Event('input'));
      triggerText.textContent = val ? title.toUpperCase() : 'SELECCIONAR CATEGORÍA...';

      // Mark checkmark selection in options list UI
      optionsList.querySelectorAll('.dropdown-option-item').forEach(btn => {
        btn.classList.remove('bg-slate-50');
        btn.querySelector('.select-checkmark')?.classList.add('hidden');
      });
      target.classList.add('bg-slate-50');
      target.querySelector('.select-checkmark')?.classList.remove('hidden');

      // Close dropdown
      closeAllDropdowns();
    });
  });

  // Close dropdowns when clicking anywhere outside
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // --- Dynamic Hero Slides UI management ---
  const addHeroSlideBtn = document.getElementById('add-hero-slide-btn');
  const heroSlidesContainer = document.getElementById('hero-slides-list-container');

  addHeroSlideBtn?.addEventListener('click', () => {
    if (!heroSlidesContainer) return;
    const collections = getDbCollections();
    const id = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const index = heroSlidesContainer.querySelectorAll('.hero-slide-card').length;
    
    const card = document.createElement('div');
    card.className = "hero-slide-card border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col gap-4 relative group";
    card.setAttribute('data-id', id);
    card.innerHTML = createSlideCardHTML(id, index, collections || []);
    
    heroSlidesContainer.appendChild(card);
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Reorder Up
    const upBtn = target.closest('.move-slide-up-btn');
    if (upBtn) {
      const card = upBtn.closest('.hero-slide-card') as HTMLDivElement;
      const previous = card?.previousElementSibling;
      if (card && previous && previous.classList.contains('hero-slide-card')) {
        card.parentNode?.insertBefore(card, previous);
        updateSlideIndices();
      }
      return;
    }
    
    // Reorder Down
    const downBtn = target.closest('.move-slide-down-btn');
    if (downBtn) {
      const card = downBtn.closest('.hero-slide-card') as HTMLDivElement;
      const next = card?.nextElementSibling;
      if (card && next && next.classList.contains('hero-slide-card')) {
        card.parentNode?.insertBefore(next, card);
        updateSlideIndices();
      }
      return;
    }
    
    // Delete slide
    const deleteBtn = target.closest('.delete-slide-btn');
    if (deleteBtn) {
      const card = deleteBtn.closest('.hero-slide-card');
      if (card && confirm('¿Estás seguro de que quieres eliminar esta diapositiva?')) {
        card.remove();
        updateSlideIndices();
      }
      return;
    }
  });

  document.addEventListener('change', (e) => {
    const select = e.target as HTMLSelectElement;
    if (select.classList.contains('slide-desktop-type') || select.classList.contains('slide-mobile-type')) {
      const isDesktop = select.classList.contains('slide-desktop-type');
      const card = select.closest('.hero-slide-card') as HTMLDivElement;
      if (!card) return;
      
      const prefix = isDesktop ? 'desktop' : 'mobile';
      const btn = card.querySelector(`.open-settings-gallery-btn[data-input$="${prefix}-input"], .open-settings-video-gallery-btn[data-input$="${prefix}-input"]`) as HTMLButtonElement;
      const input = card.querySelector(`.slide-${prefix}-url`) as HTMLInputElement;
      const preview = card.querySelector(`[id$="${prefix}-preview"]`) as HTMLDivElement;
      
      if (btn) {
        if (select.value === 'video') {
          btn.className = btn.className.replace('open-settings-gallery-btn', 'open-settings-video-gallery-btn');
        } else {
          btn.className = btn.className.replace('open-settings-video-gallery-btn', 'open-settings-gallery-btn');
        }
      }
      
      if (input && preview) {
        updatePreviewMedia(preview, select.value as 'image' | 'video', input.value);
      }
    }
  });

  document.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.classList.contains('slide-desktop-url') || input.classList.contains('slide-mobile-url')) {
      const isDesktop = input.classList.contains('slide-desktop-url');
      const card = input.closest('.hero-slide-card') as HTMLDivElement;
      if (!card) return;
      
      const prefix = isDesktop ? 'desktop' : 'mobile';
      const typeSelect = card.querySelector(`.slide-${prefix}-type`) as HTMLSelectElement;
      const preview = card.querySelector(`[id$="${prefix}-preview"]`) as HTMLDivElement;
      
      if (typeSelect && preview) {
        updatePreviewMedia(preview, typeSelect.value as 'image' | 'video', input.value.trim());
      }
    }
  });

  function updatePreviewMedia(previewEl: HTMLDivElement, type: 'image' | 'video', url: string) {
    if (!url) {
      previewEl.innerHTML = `<span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>`;
      return;
    }
    if (type === 'video') {
      previewEl.innerHTML = `<video src="${url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
    } else {
      previewEl.innerHTML = `<img src="${url}" class="w-full h-full object-cover" />`;
    }
  }

  function updateSlideIndices() {
    const labels = document.querySelectorAll('.hero-slide-card .slide-index-label');
    labels.forEach((label, idx) => {
      label.textContent = `Diapositiva #${idx + 1}`;
    });
  }

  function createSlideCardHTML(id: string, index: number, collections: any[] = []) {
    const optionsHTML = collections.map(c => `
      <option value="${c.id}">${c.title} (${c.slug})</option>
    `).join('');

    return `
      <!-- Header of the card -->
      <div class="flex justify-between items-center border-b border-slate-200/80 pb-2">
        <div class="flex items-center gap-3">
          <span class="text-3xs font-black uppercase text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg slide-index-label">Diapositiva #${index + 1}</span>
          <div class="flex gap-1">
            <button type="button" class="move-slide-up-btn text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer" title="Subir">↑</button>
            <button type="button" class="move-slide-down-btn text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer" title="Bajar">↓</button>
          </div>
          <label class="flex items-center gap-1.5 cursor-pointer ml-2">
            <input type="checkbox" class="slide-show-title w-3.5 h-3.5 rounded text-rose-600 border-slate-300 focus:ring-rose-600 cursor-pointer" checked />
            <span class="text-3xs font-extrabold uppercase text-slate-500 select-none">Mostrar Título (FLEX FORM FITNESS)</span>
          </label>
        </div>
        <button type="button" class="delete-slide-btn text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-colors font-extrabold text-2xs uppercase tracking-wider cursor-pointer">
          Eliminar
        </button>
      </div>

      <!-- Media (Desktop vs Mobile) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Versión Desktop -->
        <div class="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-200/60">
          <div class="flex justify-between items-center mb-1">
            <span class="font-extrabold uppercase text-slate-800 text-3xs tracking-wider">Versión Escritorio (Desktop)</span>
            <select class="slide-desktop-type px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-rose-600 text-3xs font-extrabold uppercase tracking-wider cursor-pointer">
              <option value="image" selected>Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div class="flex gap-1.5">
            <input
              type="text"
              class="slide-desktop-url flex-grow min-w-0 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-2xs"
              placeholder="URL de imagen/video o selecciona de la galería"
              value=""
              id="slide-${id}-desktop-input"
            />
            <button
              type="button"
              class="open-settings-gallery-btn px-2.5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-3xs font-extrabold uppercase transition-colors shrink-0 cursor-pointer"
              data-input="slide-${id}-desktop-input"
              data-preview="slide-${id}-desktop-preview"
            >
              Galería
            </button>
          </div>
          <div id="slide-${id}-desktop-preview" class="h-48 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mt-1 mx-auto">
            <span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>
          </div>
        </div>

        <!-- Versión Mobile -->
        <div class="flex flex-col gap-2 bg-white p-3.5 rounded-xl border border-slate-200/60">
          <div class="flex justify-between items-center mb-1">
            <span class="font-extrabold uppercase text-slate-800 text-3xs tracking-wider">Versión Móvil (Mobile)</span>
            <select class="slide-mobile-type px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-rose-600 text-3xs font-extrabold uppercase tracking-wider cursor-pointer">
              <option value="image" selected>Imagen</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div class="flex gap-1.5">
            <input
              type="text"
              class="slide-mobile-url flex-grow min-w-0 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 font-mono text-2xs"
              placeholder="URL de imagen/video o selecciona de la galería"
              value=""
              id="slide-${id}-mobile-input"
            />
            <button
              type="button"
              class="open-settings-gallery-btn px-2.5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-3xs font-extrabold uppercase transition-colors shrink-0 cursor-pointer"
              data-input="slide-${id}-mobile-input"
              data-preview="slide-${id}-mobile-preview"
            >
              Galería
            </button>
          </div>
          <div id="slide-${id}-mobile-preview" class="h-48 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mt-1 mx-auto">
            <span class="text-3xs text-slate-400 font-bold uppercase tracking-widest">Sin Vista Previa</span>
          </div>
        </div>
      </div>

      <!-- CTA Button and Target Collection Configuration -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
        <!-- Botón Secundario (Izquierda) -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200/60 flex flex-col gap-2">
          <div class="flex justify-between items-center mb-1">
            <span class="font-extrabold uppercase text-slate-800 text-3xs tracking-wider">Botón Izquierdo</span>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" class="slide-btn2-enabled w-3.5 h-3.5 rounded text-rose-600 border-slate-300 focus:ring-rose-600" />
              <span class="text-3xs font-extrabold uppercase text-slate-500">Habilitado</span>
            </label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Texto (ES)</label>
              <input type="text" class="slide-btn2-text w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 text-xs" placeholder="Ej: Nueva Cápsula" value="Nueva Cápsula" />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Texto (EN)</label>
              <input type="text" class="slide-btn2-text-en w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 text-xs" placeholder="Ej: New Capsule" value="New Capsule" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Colección de Destino</label>
              <select class="slide-btn2-collection-id w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-rose-600 text-xs cursor-pointer">
                <option value="">-- Catálogo General --</option>
                ${optionsHTML}
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Estilo de Botón</label>
              <select class="slide-btn2-style w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-rose-600 text-xs cursor-pointer">
                <option value="primary" selected>Rojo Relleno (Nueva Cápsula)</option>
                <option value="secondary">Borde Blanco (Outline)</option>
                <option value="pink">Rosa Relleno (Chica)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Botón Derecho (Principal) -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200/60 flex flex-col gap-2">
          <div class="flex justify-between items-center mb-1">
            <span class="font-extrabold uppercase text-slate-800 text-3xs tracking-wider">Botón Derecho</span>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" class="slide-btn1-enabled w-3.5 h-3.5 rounded text-rose-600 border-slate-300 focus:ring-rose-600" checked />
              <span class="text-3xs font-extrabold uppercase text-slate-500">Habilitado</span>
            </label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Texto (ES)</label>
              <input type="text" class="slide-btn1-text w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 text-xs" placeholder="Ej: Comprar ahora" value="Comprar ahora" />
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Texto (EN)</label>
              <input type="text" class="slide-btn1-text-en w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 text-xs" placeholder="Ej: Shop now" value="Shop now" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Colección de Destino</label>
              <select class="slide-btn1-collection-id w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 text-xs cursor-pointer">
                <option value="">-- Catálogo General --</option>
                ${optionsHTML}
              </select>
            </div>
            <div>
              <label class="block font-semibold mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Estilo de Botón</label>
              <select class="slide-btn1-style w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 focus:outline-none focus:border-rose-600 text-xs cursor-pointer">
                <option value="secondary" selected>Borde Blanco (Outline)</option>
                <option value="primary">Rojo Relleno (Nueva Cápsula)</option>
                <option value="pink">Rosa Relleno (Chica)</option>
              </select>
            </div>
          </div>
      </div>
    `;
  }
}
