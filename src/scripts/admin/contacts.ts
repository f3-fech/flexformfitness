import { actions } from 'astro:actions';
import { state } from './state';
import { toggleModal, showToast } from './utils';

// Elements
const contactsTableBody = document.getElementById('contacts-table-body') as HTMLTableSectionElement;
const contactsPrevBtn = document.getElementById('contacts-prev-btn') as HTMLButtonElement;
const contactsNextBtn = document.getElementById('contacts-next-btn') as HTMLButtonElement;
const contactsPageInfo = document.getElementById('contacts-page-info') as HTMLSpanElement;

// Modal Elements
const contactDetailsModal = document.getElementById('contact-details-modal') as HTMLDivElement;
const closeContactModal = document.getElementById('close-contact-modal') as HTMLButtonElement;
const closeContactModalBtn = document.getElementById('close-contact-modal-btn') as HTMLButtonElement;
const contactDeleteBtn = document.getElementById('contact-delete-btn') as HTMLButtonElement;
const contactToggleStatusBtn = document.getElementById('contact-toggle-status-btn') as HTMLButtonElement;

// Detail placeholders
const detailName = document.getElementById('contact-detail-name') as HTMLParagraphElement;
const detailDate = document.getElementById('contact-detail-date') as HTMLParagraphElement;
const detailEmail = document.getElementById('contact-detail-email') as HTMLParagraphElement;
const detailMessage = document.getElementById('contact-detail-message') as HTMLDivElement;

let activeContactId: string | null = null;
let activeContactStatus: 'read' | 'unread' = 'unread';

// Load contact messages
export async function loadContactsList(lastVisibleId: string | null = null) {
  if (!contactsTableBody) return;

  contactsTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="py-8 text-center text-slate-400 font-medium">Cargando bandeja de entrada...</td>
    </tr>
  `;

  if (contactsPrevBtn) contactsPrevBtn.disabled = true;
  if (contactsNextBtn) contactsNextBtn.disabled = true;

  try {
    const { data, error } = await actions.getContactMessages({
      limit: 15, // 15 per page
      lastVisibleId: lastVisibleId || undefined,
    });

    if (error) throw error;
    state.contacts.loaded = true;

    const contacts = data?.contacts || [];
    state.contacts.nextVisibleId = data?.nextVisibleId || null;
    const hasMore = data?.hasMore || false;

    if (contacts.length === 0) {
      contactsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400 font-medium">No se han encontrado mensajes de contacto.</td>
        </tr>
      `;
      if (contactsPageInfo) contactsPageInfo.textContent = `Página ${state.contacts.currentPage}`;
      return;
    }

    contactsTableBody.innerHTML = contacts.map((msg: any) => {
      const formattedDate = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A';
      const previewText = msg.message.length > 60 ? msg.message.substring(0, 60) + '...' : msg.message;
      
      const statusBadge = msg.status === 'unread'
        ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-1 text-2xs font-extrabold text-rose-600 tracking-wider uppercase border border-rose-100">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Nuevo
           </span>`
        : `<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-2xs font-extrabold text-slate-400 tracking-wider uppercase border border-slate-150">
            Leído
           </span>`;

      return `
        <tr class="contact-row hover:bg-slate-50/50 transition-colors cursor-pointer" data-id="${msg.id}" data-name="${encodeURIComponent(msg.name)}" data-email="${encodeURIComponent(msg.email)}" data-date="${formattedDate}" data-status="${msg.status}" data-message="${encodeURIComponent(msg.message)}">
          <td class="py-4 px-5">
            <div class="font-bold text-slate-900">${msg.name}</div>
            <div class="text-slate-400 text-3xs font-mono">${msg.email}</div>
          </td>
          <td class="py-4 px-5 text-slate-600 font-medium max-w-xs truncate">
            ${previewText}
          </td>
          <td class="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">
            ${formattedDate}
          </td>
          <td class="py-4 px-5">
            ${statusBadge}
          </td>
          <td class="py-4 px-5 text-right whitespace-nowrap flex items-center justify-end gap-3.5">
            <button type="button" class="btn-view-msg text-xs font-bold text-slate-900 hover:text-rose-600 transition-colors uppercase tracking-wider cursor-pointer" data-id="${msg.id}">
              Ver
            </button>
            <button type="button" class="btn-delete-msg text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-wider cursor-pointer" data-id="${msg.id}">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Setup action triggers for rows
    setupRowTriggers();

    // Update pagination buttons
    if (contactsPageInfo) contactsPageInfo.textContent = `Página ${state.contacts.currentPage}`;
    if (contactsPrevBtn) contactsPrevBtn.disabled = state.contacts.currentPage === 1;
    if (contactsNextBtn) contactsNextBtn.disabled = !hasMore;

  } catch (error: any) {
    console.error('Error loading contacts:', error);
    if (showToast) showToast('Error al cargar la bandeja de entrada', 'error');
    contactsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-rose-500 font-semibold">Error al cargar los mensajes. Intenta recargar la página.</td>
      </tr>
    `;
  }
}

// Setup Event listeners for rows
function setupRowTriggers() {
  const rows = document.querySelectorAll('.contact-row');
  rows.forEach((row) => {
    row.addEventListener('click', (e) => {
      // Don't open if clicked directly on dynamic actions button (will handle separately)
      const target = e.target as HTMLElement;
      if (target.classList.contains('btn-view-msg') || target.classList.contains('btn-delete-msg')) return;
      openDetails(row as HTMLTableRowElement);
    });

    const viewBtn = row.querySelector('.btn-view-msg');
    viewBtn?.addEventListener('click', () => {
      openDetails(row as HTMLTableRowElement);
    });

    const deleteBtn = row.querySelector('.btn-delete-msg');
    deleteBtn?.addEventListener('click', async (e) => {
      e.stopPropagation(); // Stop row click opening modal
      const id = deleteBtn.getAttribute('data-id');
      if (!id) return;
      if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
      try {
        const { error } = await actions.deleteContactMessage({ id });
        if (error) throw error;
        showToast('Mensaje eliminado correctamente', 'success');
        // Reload active page
        const lastVisibleId = state.contacts.pageHistory[state.contacts.currentPage - 2] || null;
        loadContactsList(lastVisibleId);
      } catch (err) {
        console.error('Error deleting message:', err);
        showToast('Error al eliminar el mensaje', 'error');
      }
    });
  });
}

// Open modal and show details
async function openDetails(row: HTMLTableRowElement) {
  const id = row.getAttribute('data-id');
  if (!id) return;

  activeContactId = id;
  const name = decodeURIComponent(row.getAttribute('data-name') || '');
  const email = decodeURIComponent(row.getAttribute('data-email') || '');
  const date = row.getAttribute('data-date') || '';
  const status = row.getAttribute('data-status') as 'read' | 'unread';
  activeContactStatus = status;

  // To avoid truncated texts, let's load details from state list or table row data
  // Wait, let's find the actual contact from data or request it!
  // Wait, it is simple: we can embed the raw message as a data attribute on the row!
  // Let's check: we can add data-message attribute.
  // Wait, let's look at the row generator, let's add `data-message="${encodeURIComponent(msg.message)}"` to the row.
  const rawMessage = decodeURIComponent(row.getAttribute('data-message') || row.cells[1].textContent || '');

  // Fill in detail text fields
  if (detailName) detailName.textContent = name;
  if (detailDate) detailDate.textContent = date;
  if (detailEmail) detailEmail.textContent = email;
  if (detailMessage) detailMessage.innerHTML = rawMessage.replace(/\n/g, '<br/>');

  // Toggle button texts
  if (contactToggleStatusBtn) {
    contactToggleStatusBtn.textContent = status === 'unread' ? 'Marcar como leído' : 'Marcar como no leído';
  }

  // Open modal
  if (contactDetailsModal) {
    toggleModal(contactDetailsModal, true);
  }

  // Automatically mark as read if it is currently unread
  if (status === 'unread') {
    try {
      await actions.updateContactStatus({ id, status: 'read' });
      row.setAttribute('data-status', 'read');
      // Update row badge locally
      const badgeTd = row.cells[3];
      if (badgeTd) {
        badgeTd.innerHTML = `
          <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-2xs font-extrabold text-slate-400 tracking-wider uppercase border border-slate-150">
            Leído
          </span>
        `;
      }
      activeContactStatus = 'read';
      if (contactToggleStatusBtn) contactToggleStatusBtn.textContent = 'Marcar como no leído';
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }
}

// Set up modal buttons
if (closeContactModal) {
  closeContactModal.addEventListener('click', () => toggleModal(contactDetailsModal, false));
}
if (closeContactModalBtn) {
  closeContactModalBtn.addEventListener('click', () => toggleModal(contactDetailsModal, false));
}

// Toggle unread/read state
contactToggleStatusBtn?.addEventListener('click', async () => {
  if (!activeContactId) return;

  const newStatus = activeContactStatus === 'read' ? 'unread' : 'read';
  try {
    const { error } = await actions.updateContactStatus({ id: activeContactId, status: newStatus });
    if (error) throw error;

    showToast(`Mensaje marcado como ${newStatus === 'read' ? 'leído' : 'no leído'}`, 'success');
    toggleModal(contactDetailsModal, false);
    // Reload active page
    const lastVisibleId = state.contacts.pageHistory[state.contacts.currentPage - 2] || null;
    loadContactsList(lastVisibleId);
  } catch (err) {
    console.error('Error toggling status:', err);
    showToast('Error al cambiar el estado del mensaje', 'error');
  }
});

// Delete message
contactDeleteBtn?.addEventListener('click', async () => {
  if (!activeContactId) return;

  if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;

  try {
    const { error } = await actions.deleteContactMessage({ id: activeContactId });
    if (error) throw error;

    showToast('Mensaje eliminado correctamente', 'success');
    toggleModal(contactDetailsModal, false);
    
    // Reload active page
    const lastVisibleId = state.contacts.pageHistory[state.contacts.currentPage - 2] || null;
    loadContactsList(lastVisibleId);
  } catch (err) {
    console.error('Error deleting message:', err);
    showToast('Error al eliminar el mensaje', 'error');
  }
});

// Pagination event handlers
contactsPrevBtn?.addEventListener('click', () => {
  if (state.contacts.currentPage > 1) {
    state.contacts.currentPage--;
    const lastVisibleId = state.contacts.pageHistory[state.contacts.currentPage - 2] || null;
    loadContactsList(lastVisibleId);
  }
});

contactsNextBtn?.addEventListener('click', () => {
  if (state.contacts.nextVisibleId) {
    const currentId = state.contacts.nextVisibleId;
    state.contacts.pageHistory[state.contacts.currentPage - 1] = currentId;
    state.contacts.currentPage++;
    loadContactsList(currentId);
  }
});
