import { actions } from 'astro:actions';
import { showToast } from './utils';

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
  const heroVideoUrl = (document.getElementById('settings-hero-video') as HTMLInputElement).value.trim() || undefined;
  const admins = Array.from(document.querySelectorAll('.admin-row')).map(el => el.getAttribute('data-email') || '').filter(Boolean);

  const s1Title = (document.getElementById('megamenu-s1-title') as HTMLInputElement)?.value.trim() || 'Nuestras Colecciones';
  const s1TitleEn = (document.getElementById('megamenu-s1-title-en') as HTMLInputElement)?.value.trim() || 'Our Collections';
  const s1Collections = s1SelectedIds;

  const s2Title = (document.getElementById('megamenu-s2-title') as HTMLInputElement)?.value.trim() || 'Más Categorías';
  const s2TitleEn = (document.getElementById('megamenu-s2-title-en') as HTMLInputElement)?.value.trim() || 'More Categories';
  const s2Collections = s2SelectedIds;

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

  const megaMenu = {
    section1: {
      title: s1Title,
      titleEn: s1TitleEn,
      collectionIds: s1Collections,
    },
    section2: {
      title: s2Title,
      titleEn: s2TitleEn,
      collectionIds: s2Collections,
    },
    promo1: {
      imageUrl: p1Image,
      title: p1Title,
      titleEn: p1TitleEn,
      subtitle: p1Subtitle,
      subtitleEn: p1SubtitleEn,
      linkUrl: p1Link,
    },
    promo2: {
      imageUrl: p2Image,
      title: p2Title,
      titleEn: p2TitleEn,
      subtitle: p2Subtitle,
      subtitleEn: p2SubtitleEn,
      linkUrl: p2Link,
    }
  };

  return { shippingPrice, freeShippingMin, markets, logoUrl, faviconUrl, heroVideoUrl, admins, megaMenu };
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
          <span class="text-2xs font-extrabold uppercase text-slate-700 leading-tight">${col.title}</span>
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

// Initial parsing of megamenu bridge data
const megamenuBridgeEl = document.getElementById('megamenu-initial-bridge');
if (megamenuBridgeEl) {
  s1SelectedIds = JSON.parse(megamenuBridgeEl.getAttribute('data-s1') || '[]');
  s2SelectedIds = JSON.parse(megamenuBridgeEl.getAttribute('data-s2') || '[]');
  allCollections = JSON.parse(megamenuBridgeEl.getAttribute('data-all') || '[]');

  renderMegamenuList(1);
  renderMegamenuList(2);

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
}
