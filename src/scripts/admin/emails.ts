import { actions } from 'astro:actions';
import { state } from './state';

// Elements
const sendTestEmailBtn = document.getElementById('send-test-email-btn') as HTMLButtonElement;
const saveEmailSettingsBtn = document.getElementById('save-email-settings-btn') as HTMLButtonElement;
const formSubTemplates = document.getElementById('form-sub-templates') as HTMLFormElement;
const abandonedCartsTableBody = document.getElementById('abandoned-carts-table-body') as HTMLTableSectionElement;

const cartsPrevBtn = document.getElementById('carts-prev-btn') as HTMLButtonElement;
const cartsNextBtn = document.getElementById('carts-next-btn') as HTMLButtonElement;
const cartsPageInfo = document.getElementById('carts-page-info');

// Test Send email handler
sendTestEmailBtn?.addEventListener('click', async () => {
  sendTestEmailBtn.disabled = true;
  const originalText = sendTestEmailBtn.innerText;
  sendTestEmailBtn.innerText = 'Enviando...';
  try {
    const { data, error } = await actions.sendTestEmail();
    if (error) throw error;
    alert(`¡Correo de prueba enviado con éxito a ${data.recipient}!`);
  } catch (err: any) {
    console.error(err);
    alert('Error al enviar el correo de prueba: ' + (err.message || 'Error desconocido'));
  } finally {
    sendTestEmailBtn.disabled = false;
    sendTestEmailBtn.innerText = originalText;
  }
});

// Save email templates handler
formSubTemplates?.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveEmailSettingsBtn.disabled = true;
  const originalText = saveEmailSettingsBtn.innerText;
  saveEmailSettingsBtn.innerText = 'Guardando...';

  const orderSubject = (document.getElementById('email-order-subject') as HTMLInputElement).value;
  const orderBody = (document.getElementById('email-order-body') as HTMLTextAreaElement).value;
  const abandonedSubject = (document.getElementById('email-abandoned-subject') as HTMLInputElement).value;
  const abandonedBody = (document.getElementById('email-abandoned-body') as HTMLTextAreaElement).value;
  const shippedSubject = (document.getElementById('email-shipped-subject') as HTMLInputElement).value;
  const shippedBody = (document.getElementById('email-shipped-body') as HTMLTextAreaElement).value;
  const restockSubject = (document.getElementById('email-restock-subject') as HTMLInputElement)?.value || '';
  const restockBody = (document.getElementById('email-restock-body') as HTMLTextAreaElement)?.value || '';

  try {
    const { error } = await actions.updateEmailSettings({
      orderSubject,
      orderBody,
      abandonedSubject,
      abandonedBody,
      shippedSubject,
      shippedBody,
      restockSubject,
      restockBody,
    });
    if (error) throw error;
    alert('Plantillas de correo guardadas con éxito.');
  } catch (err: any) {
    console.error(err);
    alert('Error al guardar plantillas de correo: ' + (err.message || 'Error desconocido'));
  } finally {
    saveEmailSettingsBtn.disabled = false;
    saveEmailSettingsBtn.innerText = originalText;
  }
});

// Load Abandoned Carts logic
export async function loadAbandonedCarts(lastVisibleId: string | null = null) {
  if (!abandonedCartsTableBody) return;

  if (cartsPrevBtn) cartsPrevBtn.disabled = true;
  if (cartsNextBtn) cartsNextBtn.disabled = true;

  abandonedCartsTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="py-8 text-center text-slate-400 font-medium">Cargando carritos abandonados...</td>
    </tr>
  `;
  try {
    const { data, error } = await actions.getAbandonedCarts({
      limit: 20,
      lastVisibleId: lastVisibleId || undefined,
    });
    if (error) throw error;
    state.carts.loaded = true;
    
    const carts = data?.carts || [];
    state.carts.nextVisibleId = data?.nextVisibleId || null;
    const hasMore = data?.hasMore || false;

    if (cartsPageInfo) cartsPageInfo.textContent = `Página ${state.carts.currentPage}`;
    if (cartsPrevBtn) cartsPrevBtn.disabled = state.carts.currentPage === 1;
    if (cartsNextBtn) cartsNextBtn.disabled = !hasMore;

    if (carts.length === 0) {
      abandonedCartsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400 font-medium">No se detectaron carritos abandonados.</td>
        </tr>
      `;
      return;
    }

    abandonedCartsTableBody.innerHTML = carts.map((cart: any) => {
      const updatedAtDate = new Date(cart.updatedAt);
      const itemsSummary = cart.items.map((item: any) => `
        <div class="flex items-center gap-2 py-1">
          ${item.image ? `<img src="${item.image}" class="w-6 h-6 object-cover rounded" />` : ''}
          <span>${item.title} ${item.variantName ? `(${item.variantName})` : ''} <span class="text-slate-400">x${item.quantity}</span></span>
        </div>
      `).join('');

      // Human-readable date time ago
      const diffMs = new Date().getTime() - updatedAtDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timeAgo = '';
      if (diffDays > 0) timeAgo = `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      else if (diffHours > 0) timeAgo = `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      else timeAgo = `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
      
      const consentBadge = cart.marketingConsent 
         ? `<span class="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-4xs font-semibold text-emerald-700 tracking-wider uppercase mt-1 w-fit">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Marketing OK
            </span>`
         : `<span class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-4xs font-semibold text-slate-500 tracking-wider uppercase mt-1 w-fit">
             <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> No Marketing
            </span>`;

      return `
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="py-4 px-5">
            <div class="font-bold text-slate-900">${cart.name}</div>
            <div class="text-slate-400 text-3xs">${cart.email}</div>
            ${consentBadge}
          </td>
          <td class="py-4 px-5 text-slate-500 font-mono text-3xs">
            <div>${updatedAtDate.toLocaleDateString()}</div>
            <div class="text-slate-400">${timeAgo}</div>
          </td>
          <td class="py-4 px-5 text-slate-600 font-medium">
            ${itemsSummary}
          </td>
          <td class="py-4 px-5 font-bold font-mono text-slate-900">
            ${(cart.totalAmount / 100).toFixed(2)} €
          </td>
          <td class="py-4 px-5 text-right">
            <button
              type="button"
              data-user-id="${cart.userId}"
              class="send-recovery-email-btn px-3 py-2 bg-rose-600 hover:bg-red-700 text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Enviar Recordatorio
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Register listeners for send recordatorio buttons
    document.querySelectorAll('.send-recovery-email-btn').forEach((btn: any) => {
      btn.addEventListener('click', async (e: any) => {
        const userId = btn.getAttribute('data-user-id');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Enviando...';
        try {
          const { error } = await actions.sendAbandonedCartEmail({ userId });
          if (error) throw error;
          alert('¡Correo de recuperación enviado con éxito!');
          btn.className = "px-3 py-2 bg-emerald-600 text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider cursor-default inline-flex items-center gap-1";
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Enviado
          `;
        } catch (err: any) {
          console.error(err);
          alert('Error al enviar el correo: ' + (err.message || 'Error desconocido'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });
    });
  } catch (err: any) {
    console.error('Error loading abandoned carts:', err);
    abandonedCartsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-rose-600 font-medium">Error al cargar carritos: ${err.message || 'Error desconocido'}</td>
      </tr>
    `;
  }
}

// Carts Pagination Event Listeners
cartsPrevBtn?.addEventListener('click', () => {
  if (state.carts.currentPage > 1) {
    state.carts.pageHistory.pop();
    state.carts.currentPage--;
    const prevId = state.carts.pageHistory[state.carts.pageHistory.length - 1] || null;
    loadAbandonedCarts(prevId);
  }
});

cartsNextBtn?.addEventListener('click', () => {
  if (state.carts.nextVisibleId) {
    state.carts.pageHistory.push(state.carts.nextVisibleId);
    state.carts.currentPage++;
    loadAbandonedCarts(state.carts.nextVisibleId);
  }
});

// Elements for Restock Notifications
const restockTableBody = document.getElementById('restock-table-body') as HTMLTableSectionElement | null;
const restockPrevBtn = document.getElementById('restock-prev-btn') as HTMLButtonElement | null;
const restockNextBtn = document.getElementById('restock-next-btn') as HTMLButtonElement | null;
const restockPageInfo = document.getElementById('restock-page-info');

export async function loadRestockNotifications(lastVisibleId: string | null = null) {
  if (!restockTableBody) return;

  if (restockPrevBtn) restockPrevBtn.disabled = true;
  if (restockNextBtn) restockNextBtn.disabled = true;

  restockTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="py-8 text-center text-slate-400 font-medium">Cargando avisos de reposición...</td>
    </tr>
  `;

  try {
    const { data, error } = await actions.getRestockNotifications({
      limit: 20,
      lastVisibleId: lastVisibleId || undefined,
    });
    if (error) throw error;
    state.restock.loaded = true;

    const notifs = data?.notifications || [];
    state.restock.nextVisibleId = data?.nextVisibleId || null;
    const hasMore = data?.hasMore || false;

    if (restockPageInfo) restockPageInfo.textContent = `Página ${state.restock.currentPage}`;
    if (restockPrevBtn) restockPrevBtn.disabled = state.restock.currentPage === 1;
    if (restockNextBtn) restockNextBtn.disabled = !hasMore;

    if (notifs.length === 0) {
      restockTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-slate-400 font-medium">No hay avisos de reposición registrados.</td>
        </tr>
      `;
      return;
    }

    restockTableBody.innerHTML = notifs.map((n: any) => {
      const createdDate = n.createdAt ? new Date(n.createdAt).toLocaleString() : '-';
      const notifiedDate = n.notifiedAt ? new Date(n.notifiedAt).toLocaleDateString() : '';

      return `
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="py-4 px-5">
            <span class="font-bold text-slate-900">${n.email}</span>
          </td>
          <td class="py-4 px-5 font-semibold text-slate-800">
            ${n.productTitle}
          </td>
          <td class="py-4 px-5">
            <span class="inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-900 font-mono font-bold text-3xs uppercase rounded-md">
              ${n.size ? n.size.toUpperCase() : '-'}
            </span>
          </td>
          <td class="py-4 px-5 text-slate-500 font-mono text-3xs">
            ${createdDate}
          </td>
          <td class="py-4 px-5">
            ${n.notified ? `
              <span class="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full text-3xs font-bold uppercase">
                ✓ Notificado ${notifiedDate ? `(${notifiedDate})` : ''}
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full text-3xs font-bold uppercase">
                ⏳ Pendiente
              </span>
            `}
          </td>
          <td class="py-4 px-5 text-right">
            ${n.notified ? `
              <button disabled class="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-3xs font-bold uppercase cursor-default">
                Ya Enviado
              </button>
            ` : `
              <button
                type="button"
                data-notif-id="${n.id}"
                class="send-restock-btn px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-3xs inline-flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3 text-rose-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                Enviar Correo de Stock
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Attach click listeners to send restock buttons
    document.querySelectorAll('.send-restock-btn').forEach((btn: any) => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notif-id');
        if (!notifId) return;

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Enviando...';

        try {
          const { error: sendErr } = await actions.sendRestockEmail({ notificationId: notifId });
          if (sendErr) throw sendErr;

          alert('¡Correo de aviso de reposición enviado correctamente!');
          btn.className = "px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-3xs font-bold uppercase cursor-default inline-flex items-center gap-1";
          btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Enviado
          `;
        } catch (err: any) {
          console.error(err);
          alert('Error al enviar correo de reposición: ' + (err.message || 'Error desconocido'));
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      });
    });
  } catch (err: any) {
    console.error('Error loading restock notifications:', err);
    restockTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-rose-600 font-medium">Error al cargar avisos: ${err.message || 'Error desconocido'}</td>
      </tr>
    `;
  }
}

// Restock Pagination Event Listeners
restockPrevBtn?.addEventListener('click', () => {
  if (state.restock.currentPage > 1) {
    state.restock.pageHistory.pop();
    state.restock.currentPage--;
    const prevId = state.restock.pageHistory[state.restock.pageHistory.length - 1] || null;
    loadRestockNotifications(prevId);
  }
});

restockNextBtn?.addEventListener('click', () => {
  if (state.restock.nextVisibleId) {
    state.restock.pageHistory.push(state.restock.nextVisibleId);
    state.restock.currentPage++;
    loadRestockNotifications(state.restock.nextVisibleId);
  }
});
