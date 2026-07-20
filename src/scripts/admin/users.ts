import { actions } from 'astro:actions';
import { state } from './state';
import { toggleModal } from './utils';

// Elements
const usersTableBody = document.getElementById('users-table-body') as HTMLTableSectionElement;
const usersSearchInput = document.getElementById('users-search-input') as HTMLInputElement;
const usersPrevBtn = document.getElementById('users-prev-btn') as HTMLButtonElement;
const usersNextBtn = document.getElementById('users-next-btn') as HTMLButtonElement;
const usersPageInfo = document.getElementById('users-page-info') as HTMLSpanElement;

const userDetailsModal = document.getElementById('user-details-modal') as HTMLDivElement;
const closeUserDetailsModal = document.getElementById('close-user-details-modal') as HTMLButtonElement;
const closeUserDetailsBtn = document.getElementById('close-user-details-btn') as HTMLButtonElement;
const exportUsersCsvBtn = document.getElementById('export-users-csv-btn') as HTMLButtonElement;

// Load Users List from server
export async function loadUsersList(lastVisibleId: string | null = null) {
  if (!usersTableBody) return;
  usersTableBody.innerHTML = `
    <tr>
      <td colspan="4" class="py-8 text-center text-slate-400 font-medium">Cargando lista de usuarios...</td>
    </tr>
  `;
  
  if (usersPrevBtn) usersPrevBtn.disabled = true;
  if (usersNextBtn) usersNextBtn.disabled = true;

  try {
    const searchQuery = usersSearchInput ? usersSearchInput.value.trim() : '';
    const { data, error } = await actions.getUsersList({
      search: searchQuery,
      limit: 50,
      lastVisibleId: lastVisibleId || undefined,
    });
    if (error) throw error;
    state.users.loaded = true;

    const users = data?.users || [];
    state.users.nextVisibleId = data?.nextVisibleId || null;
    const hasMore = data?.hasMore || false;

    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="py-8 text-center text-slate-400 font-medium">No se encontraron usuarios.</td>
        </tr>
      `;
      if (usersPageInfo) usersPageInfo.textContent = `Página ${state.users.currentPage}`;
      return;
    }

    usersTableBody.innerHTML = users.map((user: any) => {
      const updatedAtDate = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A';
      const marketingConsentBadge = user.marketingConsent
        ? `<span class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 tracking-wider uppercase w-fit">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aceptado
           </span>`
        : `<span class="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 tracking-wider uppercase w-fit">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Rechazado
           </span>`;

      return `
        <tr class="user-row hover:bg-slate-50/50 transition-colors cursor-pointer" data-uid="${user.uid}">
          <td class="py-4 px-5">
            <div class="font-bold text-slate-900">${user.name}</div>
            <div class="text-slate-400 text-3xs font-mono">${user.email}</div>
            <div class="text-slate-300 text-4xs font-mono">UID: ${user.uid}</div>
          </td>
          <td class="py-4 px-5 text-slate-500 font-medium">
            ${updatedAtDate}
          </td>
          <td class="py-4 px-5 text-slate-500 font-medium">
            ${user.phone || '<span class="text-slate-300">Ninguno</span>'}
          </td>
          <td class="py-4 px-5">
            ${marketingConsentBadge}
          </td>
        </tr>
      `;
    }).join('');

    // Update page controls
    if (usersPageInfo) usersPageInfo.textContent = `Página ${state.users.currentPage}`;
    if (usersPrevBtn) usersPrevBtn.disabled = state.users.currentPage === 1;
    if (usersNextBtn) usersNextBtn.disabled = !hasMore;

  } catch (err: any) {
    console.error('Error loading users list:', err);
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="py-8 text-center text-rose-600 font-medium">Error al cargar usuarios: ${err.message || 'Error desconocido'}</td>
      </tr>
    `;
  }
}

// Render User Details Profile Modal Content
export function renderUserDetails(user: any, orders: any[]) {
  const contentEl = document.getElementById('user-details-content');
  if (!contentEl) return;

  const updatedAtDate = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() + ' ' + new Date(user.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
  const address = user.address || {};

  const addressHTML = address.line1 
    ? `
      <div class="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex flex-col gap-1.5 shadow-2xs">
        <span class="text-3xs font-bold uppercase tracking-widest text-slate-400">Dirección de Envío Principal</span>
        <span class="font-bold text-slate-800">${user.name}</span>
        <span class="text-slate-655 text-slate-600">${address.line1} ${address.line2 ? `, ${address.line2}` : ''}</span>
        <span class="text-slate-655 text-slate-600">${address.postal_code} ${address.city}, ${address.state}</span>
        <span class="text-slate-655 text-slate-600 font-semibold uppercase tracking-wider">${address.country}</span>
      </div>
    `
    : `
      <div class="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 text-center py-6 text-slate-400 shadow-2xs">
        <svg class="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <span class="text-2xs font-semibold uppercase tracking-wider text-slate-400">No se ha registrado ninguna dirección</span>
      </div>
    `;

  const marketingConsentBadge = user.marketingConsent
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 border border-emerald-250 text-emerald-700 tracking-wider">Aceptado</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-50 border border-slate-200 text-slate-500 tracking-wider">Rechazado</span>`;

  const ordersHTML = orders.length > 0
    ? `
      <div class="flex flex-col gap-2">
        <span class="text-3xs font-bold uppercase tracking-widest text-slate-400 mb-1">Historial de Pedidos (${orders.length})</span>
        <div class="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-white">
          ${orders.map(order => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
            return `
              <div class="view-user-order-row p-3.5 flex justify-between items-center hover:bg-slate-50/50 transition-colors cursor-pointer" data-order-id="${order.id}">
                <div class="flex flex-col gap-0.5">
                  <span class="font-bold text-slate-900 font-mono text-2xs">${order.id.slice(-8).toUpperCase()}...</span>
                  <span class="text-slate-400 text-4xs">${orderDate}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="font-bold text-slate-700 font-mono">$${(order.totalAmount / 100).toFixed(2)}</span>
                  <span class="px-2 py-0.5 rounded text-4xs font-extrabold uppercase border ${
                    order.paymentStatus === 'paid' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : order.paymentStatus === 'refunded'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }">${order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'refunded' ? 'Reembolsado' : order.paymentStatus}</span>
                  <div class="p-1.5 text-slate-400 group-hover:text-rose-600 transition-colors">
                    <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : `
      <div class="flex flex-col gap-2">
        <span class="text-3xs font-bold uppercase tracking-widest text-slate-400 mb-1">Historial de Pedidos</span>
        <div class="border border-slate-150 bg-slate-50/50 p-6 rounded-2xl text-center text-slate-400 shadow-3xs">
          Este usuario no ha realizado ningún pedido todavía.
        </div>
      </div>
    `;

  contentEl.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      <!-- Left Column: Profile & Address -->
      <div class="lg:col-span-4 flex flex-col gap-5 w-full">
        <!-- User Basic Info -->
        <div class="flex flex-col gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150 shadow-2xs w-full">
          <span class="text-3xs font-bold uppercase tracking-widest text-slate-400 font-mono">Información del Perfil</span>
          <div class="flex flex-col gap-3.5">
            <div class="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-slate-700">
              <span class="text-slate-400 text-3xs font-bold uppercase tracking-wider font-mono">Nombre completo</span>
              <span class="font-bold text-slate-900 text-xs">${user.name}</span>
            </div>
            <div class="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-slate-700">
              <span class="text-slate-400 text-3xs font-bold uppercase tracking-wider font-mono">Correo electrónico</span>
              <span class="font-bold font-mono text-slate-900 text-xs break-all">${user.email}</span>
            </div>
            <div class="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-slate-700">
              <span class="text-slate-400 text-3xs font-bold uppercase tracking-wider font-mono">Teléfono</span>
              <span class="font-bold text-slate-900 text-xs">${user.phone || 'Ninguno'}</span>
            </div>
            <div class="flex flex-col gap-1 border-b border-slate-200/50 pb-2 text-slate-700">
              <span class="text-slate-400 text-3xs font-bold uppercase tracking-wider font-mono">Última actualización</span>
              <span class="font-bold text-slate-900 text-xs">${updatedAtDate}</span>
            </div>
            <div class="flex justify-between items-center pt-1 text-slate-700">
              <span class="text-slate-400 text-3xs font-bold uppercase tracking-wider font-mono">Boletín informativo</span>
              ${marketingConsentBadge}
            </div>
          </div>
        </div>

        <!-- Shipping Address -->
        ${addressHTML}
      </div>

      <!-- Right Column: Order History -->
      <div class="lg:col-span-8 w-full">
        ${ordersHTML}
      </div>
    </div>
  `;

  // Add event listeners to the order rows in the user details card (opens details modal)
  contentEl.querySelectorAll('.view-user-order-row').forEach(row => {
    row.addEventListener('click', async () => {
      const orderId = (row as HTMLElement).dataset.orderId || '';
      if (!orderId) return;

      // Close user modal
      toggleModal(userDetailsModal, false);

      // Open order details modal with loading state
      const orderDetailsModal = document.getElementById('order-details-modal') as HTMLDivElement;
      const orderContentEl = document.getElementById('order-details-content');
      if (orderContentEl) {
        orderContentEl.innerHTML = `
          <div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <svg class="animate-spin w-7 h-7 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-semibold uppercase tracking-wider">Cargando pedido...</span>
          </div>
        `;
      }
      toggleModal(orderDetailsModal, true);

      try {
        const { data, error } = await actions.getOrderDetails({ orderId });
        if (error || !data?.success || !data?.order) {
          throw new Error(error?.message || 'No se pudieron cargar los detalles del pedido.');
        }
        
        // Import dynamic circular dependency to prevent module loading timing bugs
        const { renderOrderDetails } = await import('./orders');
        renderOrderDetails(data.order);
      } catch (err: any) {
        if (orderContentEl) {
          orderContentEl.innerHTML = `<p class="text-rose-500 text-xs font-semibold text-center py-8">${err.message || 'Error al cargar el pedido.'}</p>`;
        }
      }
    });
  });
}

// User rows click delegate handler
usersTableBody?.addEventListener('click', async (e) => {
  const row = (e.target as HTMLElement).closest('.user-row') as HTMLElement | null;
  if (!row) return;

  const userId = row.dataset.uid || '';
  if (!userId) return;

  // Open user modal with loading state
  const contentEl = document.getElementById('user-details-content');
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <svg class="animate-spin w-7 h-7 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-xs font-semibold uppercase tracking-wider">Cargando detalles del usuario...</span>
      </div>
    `;
  }
  toggleModal(userDetailsModal, true);

  try {
    const { data, error } = await actions.getUserDetails({ userId });
    if (error || !data?.success || !data?.user) {
      throw new Error(error?.message || 'No se pudieron cargar los detalles del usuario.');
    }
    renderUserDetails(data.user, data.orders || []);
  } catch (err: any) {
    if (contentEl) {
      contentEl.innerHTML = `<p class="text-rose-500 text-xs font-semibold text-center py-8">${err.message || 'Error al cargar el usuario.'}</p>`;
    }
  }
});

// Users Pagination Event Listeners
usersPrevBtn?.addEventListener('click', () => {
  if (state.users.currentPage > 1) {
    state.users.pageHistory.pop();
    state.users.currentPage--;
    const prevId = state.users.pageHistory[state.users.pageHistory.length - 1] || null;
    loadUsersList(prevId);
  }
});

usersNextBtn?.addEventListener('click', () => {
  if (state.users.nextVisibleId) {
    state.users.pageHistory.push(state.users.nextVisibleId);
    state.users.currentPage++;
    loadUsersList(state.users.nextVisibleId);
  }
});

usersSearchInput?.addEventListener('input', () => {
  if (state.users.searchDebounceTimer) clearTimeout(state.users.searchDebounceTimer);
  state.users.searchDebounceTimer = setTimeout(() => {
    state.users.currentPage = 1;
    state.users.pageHistory = [];
    loadUsersList(null);
  }, 300);
});

// Close user modal listeners
closeUserDetailsModal?.addEventListener('click', () => toggleModal(userDetailsModal, false));
closeUserDetailsBtn?.addEventListener('click', () => toggleModal(userDetailsModal, false));

// Export CSV Action
exportUsersCsvBtn?.addEventListener('click', async () => {
  exportUsersCsvBtn.disabled = true;
  const originalText = exportUsersCsvBtn.innerHTML;
  exportUsersCsvBtn.innerHTML = `
    <svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Generando...</span>
  `;

  try {
    const { data, error } = await actions.exportUsersList({});
    if (error || !data?.success || !data?.users) {
      throw new Error(error?.message || 'No se pudieron exportar los usuarios.');
    }

    const users = data.users;
    
    // Generate CSV content
    const csvHeaders = ['UID', 'Nombre', 'Email', 'Telefono', 'Boletin Informativo (Consentimiento)', 'Ultima Actualizacion'];
    const csvRows = users.map(u => [
      u.uid,
      u.name || '',
      u.email || '',
      u.phone || '',
      u.marketingConsent ? 'Aceptado' : 'Rechazado',
      u.updatedAt ? new Date(u.updatedAt).toLocaleString() : ''
    ]);

    // Escape fields to avoid CSV breaking
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download as file (UTF-8 BOM to prevent spreadsheet accent character display issue)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_flexform_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    alert('Error al exportar usuarios: ' + err.message);
  } finally {
    exportUsersCsvBtn.disabled = false;
    exportUsersCsvBtn.innerHTML = originalText;
  }
});
