import { actions } from 'astro:actions';
import { activateTab } from './navigation';

// Elements
const notifBtn = document.getElementById('admin-notif-btn') as HTMLButtonElement;
const notifBadge = document.getElementById('admin-notif-badge') as HTMLSpanElement;
const notifDropdown = document.getElementById('admin-notif-dropdown') as HTMLDivElement;
const notifList = document.getElementById('admin-notif-list') as HTMLDivElement;

let isOpen = false;

// Fetch and load notifications
export async function loadNotifications() {
  if (!notifList) return;

  try {
    const { data, error } = await actions.getAdminNotifications({});
    if (error) throw error;

    const notifications = data?.notifications || [];
    const count = notifications.length;

    // Update Badge
    if (notifBadge) {
      if (count > 0) {
        notifBadge.textContent = String(count);
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    }

    // Render list items
    if (count === 0) {
      notifList.innerHTML = `
        <div class="py-8 px-4 text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-slate-300">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          No hay notificaciones pendientes
        </div>
      `;
      return;
    }

    notifList.innerHTML = notifications.map((notif: any) => {
      let icon = '🔔';
      let iconBg = 'bg-slate-100 text-slate-600';
      if (notif.type === 'message') {
        icon = '✉️';
        iconBg = 'bg-rose-50 text-rose-600';
      } else if (notif.type === 'order') {
        icon = '📦';
        iconBg = 'bg-emerald-50 text-emerald-600';
      } else if (notif.type === 'return') {
        icon = '🔄';
        iconBg = 'bg-amber-50 text-amber-600';
      }

      const formattedTime = notif.createdAt ? new Date(notif.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';

      return `
        <div class="notif-item p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3.5 items-start" data-type="${notif.type}" data-link="${notif.link}">
          <div class="w-8 h-8 rounded-full ${iconBg} flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            ${icon}
          </div>
          <div class="flex flex-col gap-0.5 flex-grow">
            <div class="font-bold text-slate-800 text-[11px] leading-tight">${notif.title}</div>
            <div class="text-slate-400 text-3xs font-medium">${notif.description}</div>
            <div class="text-slate-300 text-4xs font-semibold mt-1 font-mono">${formattedTime}</div>
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners to items
    setupNotifItemTriggers();

  } catch (error) {
    console.error('Error loading admin notifications:', error);
    notifList.innerHTML = `
      <div class="py-6 px-4 text-center text-rose-500 font-semibold text-[11px]">
        Error al cargar notificaciones
      </div>
    `;
  }
}

// Setup triggers for each notification item
function setupNotifItemTriggers() {
  const items = document.querySelectorAll('.notif-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const link = item.getAttribute('data-link');
      if (link) {
        activateTab(link);
      }
      closeDropdown();
    });
  });
}

// Toggle Dropdown visibility
function toggleDropdown() {
  if (!isOpen) {
    notifDropdown?.classList.remove('hidden');
    isOpen = true;
    loadNotifications();
  } else {
    closeDropdown();
  }
}

function closeDropdown() {
  notifDropdown?.classList.add('hidden');
  isOpen = false;
}

// Initialize listeners
if (notifBtn) {
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}

// Close on outside click
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (isOpen && notifDropdown && !notifDropdown.contains(target) && !notifBtn.contains(target)) {
    closeDropdown();
  }
});

// Load on start and poll every 30s
loadNotifications();
setInterval(loadNotifications, 30000);
