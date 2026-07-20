import { actions } from 'astro:actions';
import { state } from './state';
import { toggleModal, showToast } from './utils';

// Elements
const ordersTableBody = document.getElementById('orders-table-body') as HTMLTableSectionElement;
const ordersPrevBtn = document.getElementById('orders-prev-btn') as HTMLButtonElement;
const ordersNextBtn = document.getElementById('orders-next-btn') as HTMLButtonElement;
const ordersPageInfo = document.getElementById('orders-page-info');

const searchOrdersInput = document.getElementById('search-orders') as HTMLInputElement;
const filterPaymentSelect = document.getElementById('filter-payment-status') as HTMLSelectElement;
const filterShippingSelect = document.getElementById('filter-shipping-status') as HTMLSelectElement;

const orderDetailsModal = document.getElementById('order-details-modal') as HTMLDivElement;
const shipModal = document.getElementById('ship-modal') as HTMLDivElement;
const shipForm = document.getElementById('ship-form') as HTMLFormElement;
const saveShipBtn = document.getElementById('save-ship-btn') as HTMLButtonElement;

// Load Orders List from server
export async function loadOrdersList(lastVisibleId: string | null = null) {
  if (!ordersTableBody) return;
  ordersTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="p-8 text-center text-slate-400 font-medium">Cargando lista de pedidos...</td>
    </tr>
  `;

  if (ordersPrevBtn) ordersPrevBtn.disabled = true;
  if (ordersNextBtn) ordersNextBtn.disabled = true;

  try {
    const searchQuery = searchOrdersInput ? searchOrdersInput.value.trim() : '';
    const paymentFilter = filterPaymentSelect ? filterPaymentSelect.value : '';
    const shippingFilter = filterShippingSelect ? filterShippingSelect.value : '';

    const { data, error } = await actions.getOrdersList({
      search: searchQuery,
      limit: 20,
      lastVisibleId: lastVisibleId || undefined,
      paymentStatus: paymentFilter || undefined,
      shippingStatus: shippingFilter || undefined,
    });
    if (error) throw error;
    state.orders.loaded = true;

    const ordersList = data?.orders || [];
    state.orders.nextVisibleId = data?.nextVisibleId || null;
    const hasMore = data?.hasMore || false;

    if (ordersPageInfo) ordersPageInfo.textContent = `Página ${state.orders.currentPage}`;
    if (ordersPrevBtn) ordersPrevBtn.disabled = state.orders.currentPage === 1;
    if (ordersNextBtn) ordersNextBtn.disabled = !hasMore;

    if (ordersList.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-400 font-medium">No se encontraron pedidos.</td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = ordersList.map((order: any) => {
      const createdAtDate = new Date(order.createdAt);
      const itemsList = order.items || [];
      const itemsHTML = itemsList.map((item: any) => `
        <span class="text-3xs text-slate-500 truncate">
          • ${item.title} ${item.variantName ? `(${item.variantName})` : ''} x${item.quantity}
        </span>
      `).join('');

      const paymentBadgeClass = order.paymentStatus === 'paid' 
        ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
        : order.paymentStatus === 'refunded'
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-amber-50 border-amber-200 text-amber-700';

      const returnPending = order.returnRequest?.status === 'pending';
      const shippingBadgeClass = returnPending
        ? 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse font-black'
        : order.shippingStatus === 'shipped' 
        ? 'bg-blue-50 border-blue-200 text-blue-700' 
        : order.shippingStatus === 'delivered'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : order.shippingStatus === 'returned'
        ? 'bg-amber-50 border-amber-200 text-amber-700'
        : order.shippingStatus === 'cancelled'
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-slate-50 border-slate-200 text-slate-600';

      const shippingStatusText = returnPending
        ? 'Devolución Solicitada'
        : `Envío: ${order.shippingStatus}`;

      const shipBtnHTML = (order.shippingStatus === 'pending' || order.shippingStatus === 'shipped')
        ? `<button
            type="button"
            class="ship-order-btn px-3 py-1.5 bg-rose-600 hover:bg-red-700 text-white rounded-lg text-3xs font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-2xs"
            data-order-id="${order.id}"
            data-shipping-status="${order.shippingStatus}"
            data-tracking-number="${order.trackingNumber || ''}"
          >
            ${order.shippingStatus === 'shipped' ? 'Completar / Editar' : 'Enviar'}
          </button>`
        : '';

      const trackingHTML = order.trackingNumber
        ? `<span class="block text-slate-500 text-3xs font-mono mt-1">
             Seguimiento: <strong class="text-slate-700">${order.trackingNumber}</strong>
           </span>`
        : '';

      return `
        <tr class="order-row hover:bg-slate-50 transition-colors cursor-pointer"
          data-id="${order.id}"
          data-name="${(order.customerDetails?.name || '').toLowerCase()}"
          data-email="${(order.customerDetails?.email || '').toLowerCase()}"
          data-payment-status="${order.paymentStatus}"
          data-shipping-status="${order.shippingStatus}"
          data-return-status="${order.returnRequest?.status || ''}"
        >
          <td class="p-4 pl-6">
            <span class="block font-bold font-mono text-slate-900 text-xs">${order.id.slice(-8).toUpperCase()}...</span>
            <span class="block text-slate-400 text-3xs mt-0.5">${createdAtDate.toLocaleDateString()} ${createdAtDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </td>
          <td class="p-4">
            <span class="block font-bold text-slate-900">${order.customerDetails?.name || 'N/A'}</span>
            <span class="block text-slate-400 text-3xs font-mono">${order.customerDetails?.email || 'N/A'}</span>
          </td>
          <td class="p-4 font-mono font-bold text-emerald-600">
            $${(order.totalAmount / 100).toFixed(2)}
          </td>
          <td class="p-4">
            <div class="flex flex-col gap-1 max-w-[200px]">
              ${itemsHTML}
            </div>
          </td>
          <td class="p-4">
            <div class="flex flex-col gap-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase w-fit tracking-wider border ${paymentBadgeClass}">
                Pago: ${order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'refunded' ? 'Reembolsado' : order.paymentStatus}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase w-fit tracking-wider border ${shippingBadgeClass}">
                ${shippingStatusText}
              </span>
            </div>
          </td>
          <td class="p-4 text-right pr-6">
            ${shipBtnHTML}
            <button
              type="button"
              class="delete-order-btn px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-3xs font-bold uppercase tracking-wider transition-colors active:scale-95 shadow-2xs ml-2"
              data-order-id="${order.id}"
            >
              Eliminar
            </button>
            ${trackingHTML}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err: any) {
    console.error('Error loading orders:', err);
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-rose-600 font-medium">Error al cargar pedidos: ${err.message || 'Error desconocido'}</td>
      </tr>
    `;
  }
}

// Render Order Details Modal Content
export function renderOrderDetails(order: any) {
  const contentEl = document.getElementById('order-details-content');
  if (!contentEl) return;

  let dateObj;
  if (order.createdAt) {
    if (order.createdAt.seconds) {
      dateObj = new Date(order.createdAt.seconds * 1000);
    } else if (order.createdAt._seconds) {
      dateObj = new Date(order.createdAt._seconds * 1000);
    } else {
      dateObj = new Date(order.createdAt);
    }
  } else {
    dateObj = new Date();
  }
  const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const address = order.customerDetails?.address || {};

  const itemsHTML = (order.items || []).map((item: any) => `
    <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      ${item.image ? `<img src="${item.image}" class="w-10 h-10 rounded-lg object-cover border border-slate-150 shrink-0" />` : '<div class="w-10 h-10 bg-slate-50 border border-slate-150 rounded-lg shrink-0 flex items-center justify-center text-slate-400 font-bold uppercase tracking-wider text-3xs">F</div>'}
      <div class="flex-grow min-w-0">
        <span class="block font-bold text-slate-800 truncate">${item.title}</span>
        ${item.variantName ? `<span class="block text-brand-600 text-3xs font-semibold">${item.variantName}</span>` : ''}
        ${item.variantSku ? `<span class="block text-slate-400 text-[9px] font-mono font-extrabold uppercase">SKU: ${item.variantSku}</span>` : ''}
      </div>
      <div class="text-right shrink-0">
        <span class="block font-bold text-slate-900">$${(item.price / 100).toFixed(2)}</span>
        <span class="block text-slate-400 text-3xs">Cant: ${item.quantity}</span>
      </div>
    </div>
  `).join('');

  contentEl.innerHTML = `
    <div class="flex flex-col gap-1 border-b border-slate-100 pb-3">
      <div class="flex justify-between items-center">
        <span class="text-xs font-bold text-slate-900 font-mono">ID: ${order.id}</span>
        <span class="text-3xs font-bold text-slate-400 uppercase tracking-wider">${dateStr}</span>
      </div>
      <div class="flex gap-2 mt-2">
        <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
          order.paymentStatus === 'paid' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : order.paymentStatus === 'refunded'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }">
          Pago: ${order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'refunded' ? 'Reembolsado' : order.paymentStatus}
        </span>
        <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
          order.shippingStatus === 'shipped' 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : order.shippingStatus === 'delivered'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : order.shippingStatus === 'returned'
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : order.shippingStatus === 'cancelled'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }">
          Envío: ${order.shippingStatus}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <h4 class="text-2xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1 mb-1">Datos del Cliente</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-3xs font-medium">
        <div>
          <span class="block text-slate-400 font-bold uppercase tracking-wider">Nombre completo</span>
          <span class="block text-slate-800 text-xs font-bold mt-0.5">${order.customerDetails?.name || 'No especificado'}</span>
        </div>
        <div>
          <span class="block text-slate-400 font-bold uppercase tracking-wider">Correo electrónico</span>
          <span class="block text-slate-800 text-xs font-bold mt-0.5">${order.customerDetails?.email || 'No especificado'}</span>
        </div>
        <div>
          <span class="block text-slate-400 font-bold uppercase tracking-wider">Teléfono</span>
          <span class="block text-slate-800 text-xs font-bold mt-0.5">${order.customerDetails?.phone || 'No especificado'}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <h4 class="text-2xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1 mb-1">Dirección de Envío</h4>
      <div class="grid grid-cols-1 gap-2 text-xs">
        <div>
          <span class="block text-3xs text-slate-400 font-bold uppercase tracking-wider">Dirección</span>
          <span class="block text-slate-800 font-semibold mt-0.5">
            ${address.line1 || 'No especificada'}
            ${address.line2 ? `<br/><span class="text-slate-500 font-medium">${address.line2}</span>` : ''}
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          <div>
            <span class="block text-3xs text-slate-400 font-bold uppercase tracking-wider">Ciudad</span>
            <span class="block text-slate-800 font-semibold mt-0.5">${address.city || 'No especificada'}</span>
          </div>
          <div>
            <span class="block text-3xs text-slate-400 font-bold uppercase tracking-wider">Provincia / Región</span>
            <span class="block text-slate-800 font-semibold mt-0.5">${address.state || 'No especificada'}</span>
          </div>
          <div>
            <span class="block text-3xs text-slate-400 font-bold uppercase tracking-wider">Código Postal</span>
            <span class="block text-slate-850 font-bold font-mono mt-0.5">${address.postal_code || 'No especificado'}</span>
          </div>
          <div>
            <span class="block text-3xs text-slate-400 font-bold uppercase tracking-wider">País</span>
            <span class="block text-slate-800 font-semibold mt-0.5">${address.country || 'No especificado'}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h4 class="text-2xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1">Productos Comprados</h4>
      <div class="flex flex-col gap-1">
        ${itemsHTML}
      </div>
    </div>

    <div class="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
      <div class="flex justify-between items-baseline font-extrabold text-slate-900 text-sm">
        <span class="uppercase tracking-widest text-3xs text-slate-400">Total del Pedido</span>
        <span class="text-lg text-emerald-600 font-mono">$${(order.totalAmount / 100).toFixed(2)}</span>
      </div>
      ${order.trackingNumber ? `
        <div class="flex justify-between items-center bg-blue-50/50 border border-blue-100/50 p-2.5 rounded-xl text-3xs font-bold text-blue-700 mt-2">
          <span>CÓDIGO DE SEGUIMIENTO:</span>
          <span class="font-mono text-xs">${order.trackingNumber}</span>
        </div>
      ` : ''}
      ${order.returnRequest ? `
        <div class="flex flex-col gap-2 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 mt-3.5">
          <div class="flex justify-between items-center border-b border-amber-200/60 pb-2 mb-1">
            <h4 class="text-2xs font-extrabold text-amber-600 uppercase tracking-widest">Solicitud de Devolución</h4>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              order.returnRequest.status === 'pending' ? 'bg-amber-100 border-amber-300 text-amber-700' :
              order.returnRequest.status === 'approved' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
              'bg-red-50 border-red-300 text-red-700'
            }">
              ${order.returnRequest.status === 'pending' ? 'Pendiente' : order.returnRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-3xs font-medium">
            <div>
              <span class="block text-amber-500 font-bold uppercase tracking-wider">Fecha Solicitud</span>
              <span class="block text-xs font-mono font-bold mt-0.5">${new Date(order.returnRequest.requestedAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span class="block text-amber-500 font-bold uppercase tracking-wider">Pedido ID</span>
              <span class="block text-xs font-mono font-bold mt-0.5 truncate">${order.id.slice(-8).toUpperCase()}...</span>
            </div>
          </div>
          <div class="text-3xs font-medium mt-1">
            <span class="block text-amber-500 font-bold uppercase tracking-wider">Motivo del cliente</span>
            <span class="block text-xs font-semibold mt-0.5 bg-white/70 p-2.5 rounded-lg border border-amber-100 leading-relaxed">${order.returnRequest.reason}</span>
          </div>
          ${order.returnRequest.images && order.returnRequest.images.length > 0 ? `
            <div class="text-3xs font-medium mt-1">
              <span class="block text-amber-500 font-bold uppercase tracking-wider mb-1.5">Imágenes Adjuntas (${order.returnRequest.images.length})</span>
              <div class="grid grid-cols-4 gap-2">
                ${order.returnRequest.images.map((img: string) => `
                  <a href="${img}" target="_blank" class="block aspect-square overflow-hidden rounded-lg border border-amber-200/60 hover:opacity-90 transition-opacity shadow-sm">
                    <img src="${img}" class="w-full h-full object-cover" />
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${order.returnRequest.status === 'pending' ? `
            <div class="flex gap-2 pt-3 border-t border-amber-200/60 mt-1">
              <button
                type="button"
                class="approve-return-btn flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
                data-order-id="${order.id}"
              >
                ✓ Aprobar Devolución
              </button>
              <button
                type="button"
                class="reject-return-btn flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
                data-order-id="${order.id}"
              >
                ✗ Rechazar
              </button>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// Orders Pagination click handlers
ordersPrevBtn?.addEventListener('click', () => {
  if (state.orders.currentPage > 1) {
    state.orders.pageHistory.pop();
    state.orders.currentPage--;
    const prevId = state.orders.pageHistory[state.orders.pageHistory.length - 1] || null;
    loadOrdersList(prevId);
  }
});

ordersNextBtn?.addEventListener('click', () => {
  if (state.orders.nextVisibleId) {
    state.orders.pageHistory.push(state.orders.nextVisibleId);
    state.orders.currentPage++;
    loadOrdersList(state.orders.nextVisibleId);
  }
});

// Search input and status filters change handlers
const triggerReload = () => {
  state.orders.currentPage = 1;
  state.orders.pageHistory = [];
  loadOrdersList(null);
};

searchOrdersInput?.addEventListener('input', () => {
  if (state.orders.searchDebounceTimer) clearTimeout(state.orders.searchDebounceTimer);
  state.orders.searchDebounceTimer = setTimeout(triggerReload, 300);
});

filterPaymentSelect?.addEventListener('change', triggerReload);
filterShippingSelect?.addEventListener('change', triggerReload);

// Event delegation for table body clicks (row view details, ship button, delete button)
ordersTableBody?.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  
  // Ship button click
  const shipBtn = target.closest('.ship-order-btn') as HTMLButtonElement | null;
  if (shipBtn) {
    e.stopPropagation();
    const orderId = shipBtn.dataset.orderId || '';
    const currentStatus = shipBtn.dataset.shippingStatus || 'shipped';
    const trackingNumber = shipBtn.dataset.trackingNumber || '';
    
    (document.getElementById('form-ship-order-id') as HTMLInputElement).value = orderId;
    (document.getElementById('form-ship-status') as HTMLSelectElement).value = currentStatus;
    (document.getElementById('form-ship-tracking') as HTMLInputElement).value = trackingNumber;
    
    toggleModal(shipModal, true);
    return;
  }

  // Delete button click
  const deleteBtn = target.closest('.delete-order-btn') as HTMLButtonElement | null;
  if (deleteBtn) {
    e.stopPropagation();
    const orderId = deleteBtn.dataset.orderId || '';

    if (confirm(`¿Estás seguro de que deseas eliminar el pedido "${orderId}" permanentemente? Esta acción no se puede deshacer.`)) {
      deleteBtn.disabled = true;
      const originalContent = deleteBtn.textContent;
      deleteBtn.textContent = "Eliminando...";
      
      try {
        const { error } = await actions.deleteOrder({ orderId });
        if (error) throw error;
        alert("Pedido eliminado con éxito.");
        loadOrdersList(null);
      } catch (err: any) {
        console.error("Delete order error:", err);
        alert("Error al eliminar pedido: " + (err.message || err.code));
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalContent;
      }
    }
    return;
  }

  // Row click -> View details
  const row = target.closest('.order-row') as HTMLElement | null;
  if (row) {
    const orderId = row.dataset.id || '';
    if (!orderId) return;

    const contentEl = document.getElementById('order-details-content');
    if (contentEl) {
      contentEl.innerHTML = `
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
      renderOrderDetails(data.order);
    } catch (err: any) {
      if (contentEl) {
        contentEl.innerHTML = `<p class="text-rose-500 text-xs font-semibold text-center py-8">${err.message || 'Error al cargar el pedido.'}</p>`;
      }
    }
  }
});

// Close order modal event listeners
document.getElementById('close-order-details-modal')?.addEventListener('click', () => toggleModal(orderDetailsModal, false));
document.getElementById('close-order-details-btn')?.addEventListener('click', () => toggleModal(orderDetailsModal, false));
document.getElementById('close-ship-modal')?.addEventListener('click', () => toggleModal(shipModal, false));
document.getElementById('cancel-ship-modal')?.addEventListener('click', () => toggleModal(shipModal, false));

// Shipping form submit update
shipForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveShipBtn.disabled = true;
  const originalBtnText = saveShipBtn.innerHTML;
  saveShipBtn.innerHTML = "<span>Enviando...</span>";

  const orderIdVal = (document.getElementById('form-ship-order-id') as HTMLInputElement).value;
  const statusVal = (document.getElementById('form-ship-status') as HTMLSelectElement).value as 'shipped' | 'delivered' | 'cancelled';
  const trackingVal = (document.getElementById('form-ship-tracking') as HTMLInputElement).value.trim();

  try {
    const { error } = await actions.updateShippingStatus({
      orderId: orderIdVal,
      shippingStatus: statusVal,
      trackingNumber: trackingVal,
    });
    
    if (error) throw error;

    alert("El estado de envío ha sido actualizado con éxito.");
    window.location.reload();
  } catch (err: any) {
    console.error("Update shipping action error:", err);
    alert("Error al registrar envío: " + (err.message || err.code));
    saveShipBtn.disabled = false;
    saveShipBtn.innerHTML = originalBtnText;
  }
});

// Approve / Reject return requests event delegation inside the details modal card
const orderDetailsContent = document.getElementById('order-details-content');
orderDetailsContent?.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const approveBtn = target.closest('.approve-return-btn') as HTMLButtonElement | null;
  const rejectBtn = target.closest('.reject-return-btn') as HTMLButtonElement | null;

  const btn = approveBtn || rejectBtn;
  if (!btn) return;

  const orderId = btn.dataset.orderId || '';
  const status = approveBtn ? 'approved' : 'rejected';
  const confirmMsg = approveBtn
    ? `¿Aprobar la solicitud de devolución del pedido ${orderId.slice(-8)}?`
    : `¿Rechazar la solicitud de devolución del pedido ${orderId.slice(-8)}?`;

  if (!confirm(confirmMsg)) return;

  btn.disabled = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span>Procesando...</span>';

  try {
    const { error } = await actions.updateReturnStatus({ orderId, status });
    if (error) throw error;
    alert(approveBtn ? 'Devolución aprobada. El estado del envío se ha marcado como "Devuelto".' : 'Solicitud de devolución rechazada.');
    window.location.reload();
  } catch (err: any) {
    console.error('Return status update error:', err);
    alert('Error al actualizar la devolución: ' + (err.message || err.code));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});
