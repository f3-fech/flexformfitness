import { state } from './state';
import { loadOrdersList } from './orders';
import { loadUsersList } from './users';
import { loadAbandonedCarts } from './emails';
import { loadContactsList } from './contacts';

// Elements
const tabProductsBtn = document.getElementById('tab-products-btn') as HTMLButtonElement;
const tabCollectionsBtn = document.getElementById('tab-collections-btn') as HTMLButtonElement;
const tabOrdersBtn = document.getElementById('tab-orders-btn') as HTMLButtonElement;
const tabEmailsBtn = document.getElementById('tab-emails-btn') as HTMLButtonElement;
const tabUsersBtn = document.getElementById('tab-users-btn') as HTMLButtonElement;
const tabContactsBtn = document.getElementById('tab-contacts-btn') as HTMLButtonElement;
const tabSettingsBtn = document.getElementById('tab-settings-btn') as HTMLButtonElement;

const sectionProducts = document.getElementById('section-products') as HTMLDivElement;
const sectionCollections = document.getElementById('section-collections') as HTMLDivElement;
const sectionOrders = document.getElementById('section-orders') as HTMLDivElement;
const sectionEmails = document.getElementById('section-emails') as HTMLDivElement;
const sectionUsers = document.getElementById('section-users') as HTMLDivElement;
const sectionContacts = document.getElementById('section-contacts') as HTMLDivElement;
const sectionSettings = document.getElementById('section-settings') as HTMLDivElement;

const subtabShippingBtn = document.getElementById('subtab-shipping-btn') as HTMLButtonElement;
const subtabAdminsBtn = document.getElementById('subtab-admins-btn') as HTMLButtonElement;
const subtabBrandingBtn = document.getElementById('subtab-branding-btn') as HTMLButtonElement;
const subtabMegamenuBtn = document.getElementById('subtab-megamenu-btn') as HTMLButtonElement;
const subtabCouponsBtn = document.getElementById('subtab-coupons-btn') as HTMLButtonElement;

const formSubShipping = document.getElementById('form-sub-shipping') as HTMLFormElement;
const formSubAdmins = document.getElementById('form-sub-admins') as HTMLFormElement;
const formSubBranding = document.getElementById('form-sub-branding') as HTMLFormElement;
const formSubMegamenu = document.getElementById('form-sub-megamenu') as HTMLFormElement;
const formSubCoupons = document.getElementById('form-sub-coupons') as HTMLDivElement;

const subtabTemplatesBtn = document.getElementById('subtab-templates-btn') as HTMLButtonElement;
const subtabAbandonedBtn = document.getElementById('subtab-abandoned-btn') as HTMLButtonElement;
const formSubTemplates = document.getElementById('form-sub-templates') as HTMLFormElement;
const formSubAbandoned = document.getElementById('form-sub-abandoned') as HTMLDivElement;

function deactivateAllTabs() {
  if (tabProductsBtn) tabProductsBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabCollectionsBtn) tabCollectionsBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabOrdersBtn) tabOrdersBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabEmailsBtn) tabEmailsBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabUsersBtn) tabUsersBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabContactsBtn) tabContactsBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";
  if (tabSettingsBtn) tabSettingsBtn.className = "pb-4 px-2 border-b-2 border-transparent text-slate-400 hover:text-slate-900 uppercase focus:outline-none transition-all";

  if (sectionProducts) sectionProducts.classList.add('hidden');
  if (sectionCollections) sectionCollections.classList.add('hidden');
  if (sectionOrders) sectionOrders.classList.add('hidden');
  if (sectionEmails) sectionEmails.classList.add('hidden');
  if (sectionUsers) sectionUsers.classList.add('hidden');
  if (sectionContacts) sectionContacts.classList.add('hidden');
  if (sectionSettings) sectionSettings.classList.add('hidden');
}

export function activateTab(tabName: string) {
  deactivateAllTabs();
  localStorage.setItem('flexform_active_tab', tabName);
  
  if (tabName === 'products' && tabProductsBtn && sectionProducts) {
    tabProductsBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionProducts.classList.remove('hidden');
  } else if (tabName === 'collections' && tabCollectionsBtn && sectionCollections) {
    tabCollectionsBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionCollections.classList.remove('hidden');
  } else if (tabName === 'orders' && tabOrdersBtn && sectionOrders) {
    tabOrdersBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionOrders.classList.remove('hidden');
    if (!state.orders.loaded) {
      loadOrdersList();
    }
  } else if (tabName === 'emails' && tabEmailsBtn && sectionEmails) {
    tabEmailsBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionEmails.classList.remove('hidden');
    const activeSubtab = localStorage.getItem('flexform_active_email_subtab') || 'templates';
    activateEmailSubtab(activeSubtab);
  } else if (tabName === 'users' && tabUsersBtn && sectionUsers) {
    tabUsersBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionUsers.classList.remove('hidden');
    if (!state.users.loaded) {
      loadUsersList();
    }
  } else if (tabName === 'contacts' && tabContactsBtn && sectionContacts) {
    tabContactsBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionContacts.classList.remove('hidden');
    if (!state.contacts.loaded) {
      loadContactsList();
    }
  } else if (tabName === 'settings' && tabSettingsBtn && sectionSettings) {
    tabSettingsBtn.className = "pb-4 px-2 border-b-2 border-rose-600 text-rose-600 uppercase focus:outline-none transition-all";
    sectionSettings.classList.remove('hidden');
  }
}

function deactivateAllSubtabs() {
  if (subtabShippingBtn) subtabShippingBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";
  if (subtabAdminsBtn) subtabAdminsBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";
  if (subtabBrandingBtn) subtabBrandingBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";
  if (subtabMegamenuBtn) subtabMegamenuBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";
  if (subtabCouponsBtn) subtabCouponsBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";

  if (formSubShipping) formSubShipping.classList.add('hidden');
  if (formSubAdmins) formSubAdmins.classList.add('hidden');
  if (formSubBranding) formSubBranding.classList.add('hidden');
  if (formSubMegamenu) formSubMegamenu.classList.add('hidden');
  if (formSubCoupons) formSubCoupons.classList.add('hidden');
}

export function activateSubtab(subtabName: string) {
  deactivateAllSubtabs();
  localStorage.setItem('flexform_active_subtab', subtabName);

  if (subtabName === 'shipping' && subtabShippingBtn && formSubShipping) {
    subtabShippingBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubShipping.classList.remove('hidden');
  } else if (subtabName === 'admins' && subtabAdminsBtn && formSubAdmins) {
    subtabAdminsBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubAdmins.classList.remove('hidden');
  } else if (subtabName === 'branding' && subtabBrandingBtn && formSubBranding) {
    subtabBrandingBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubBranding.classList.remove('hidden');
  } else if (subtabName === 'megamenu' && subtabMegamenuBtn && formSubMegamenu) {
    subtabMegamenuBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubMegamenu.classList.remove('hidden');
  } else if (subtabName === 'coupons' && subtabCouponsBtn && formSubCoupons) {
    subtabCouponsBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubCoupons.classList.remove('hidden');
  }
}

function deactivateAllEmailSubtabs() {
  if (subtabTemplatesBtn) subtabTemplatesBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";
  if (subtabAbandonedBtn) subtabAbandonedBtn.className = "w-full text-left px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none flex items-center gap-2.5";

  if (formSubTemplates) formSubTemplates.classList.add('hidden');
  if (formSubAbandoned) formSubAbandoned.classList.add('hidden');
}

export function activateEmailSubtab(subtabName: string) {
  deactivateAllEmailSubtabs();
  localStorage.setItem('flexform_active_email_subtab', subtabName);

  if (subtabName === 'templates' && subtabTemplatesBtn && formSubTemplates) {
    subtabTemplatesBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubTemplates.classList.remove('hidden');
  } else if (subtabName === 'abandoned' && subtabAbandonedBtn && formSubAbandoned) {
    subtabAbandonedBtn.className = "w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all focus:outline-none flex items-center gap-2.5 bg-red-50 text-rose-600";
    formSubAbandoned.classList.remove('hidden');
    if (!state.carts.loaded) {
      loadAbandonedCarts();
    }
  }
}

// Event Listeners for main tab buttons
tabProductsBtn?.addEventListener('click', () => activateTab('products'));
tabCollectionsBtn?.addEventListener('click', () => activateTab('collections'));
tabOrdersBtn?.addEventListener('click', () => activateTab('orders'));
tabEmailsBtn?.addEventListener('click', () => activateTab('emails'));
tabUsersBtn?.addEventListener('click', () => activateTab('users'));
tabContactsBtn?.addEventListener('click', () => activateTab('contacts'));
tabSettingsBtn?.addEventListener('click', () => activateTab('settings'));

// Event Listeners for settings subtab buttons
subtabShippingBtn?.addEventListener('click', () => activateSubtab('shipping'));
subtabAdminsBtn?.addEventListener('click', () => activateSubtab('admins'));
subtabBrandingBtn?.addEventListener('click', () => activateSubtab('branding'));
subtabMegamenuBtn?.addEventListener('click', () => activateSubtab('megamenu'));
subtabCouponsBtn?.addEventListener('click', () => activateSubtab('coupons'));

// Event Listeners for email subtab buttons
subtabTemplatesBtn?.addEventListener('click', () => activateEmailSubtab('templates'));
subtabAbandonedBtn?.addEventListener('click', () => activateEmailSubtab('abandoned'));

// Initial tab selections on startup
const savedTab = localStorage.getItem('flexform_active_tab') || 'products';
activateTab(savedTab);

const savedSubtab = localStorage.getItem('flexform_active_subtab') || 'shipping';
activateSubtab(savedSubtab);
