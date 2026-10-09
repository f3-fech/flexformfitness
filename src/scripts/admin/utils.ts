import { actions } from 'astro:actions';

// Toggle modal visibility and lock/unlock background scroll
export function toggleModal(modal: HTMLElement | null, open: boolean) {
  if (!modal) return;
  if (open) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
  } else {
    modal.classList.add('hidden');
    // Check if any other modal is still open before unlocking scroll
    const anyOpen = Array.from(document.querySelectorAll('#collection-modal, #product-modal, #gallery-modal, #video-gallery-modal, #ship-modal, #crop-modal, #order-details-modal, #user-details-modal'))
      .some(m => !m.classList.contains('hidden'));
    if (!anyOpen) {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }
  }
}

// Global window event listeners to prevent background scroll bounce when modals are open
const handleWheel = (e: WheelEvent) => {
  const anyOpen = Array.from(document.querySelectorAll('#collection-modal, #product-modal, #gallery-modal, #video-gallery-modal, #ship-modal, #crop-modal, #order-details-modal, #user-details-modal'))
    .some(m => !m.classList.contains('hidden'));
  if (!anyOpen) return;
  
  const target = e.target as HTMLElement;
  const isInsideModalCard = target.closest(
    '#collection-modal > div, #product-modal > div, #gallery-modal > div, #video-gallery-modal > div, #ship-modal > div, #crop-modal > div, #order-details-modal > div, #user-details-modal > div'
  );
  if (!isInsideModalCard) {
    e.preventDefault();
  }
};

const handleTouch = (e: TouchEvent) => {
  const anyOpen = Array.from(document.querySelectorAll('#collection-modal, #product-modal, #gallery-modal, #video-gallery-modal, #ship-modal, #crop-modal, #order-details-modal, #user-details-modal'))
    .some(m => !m.classList.contains('hidden'));
  if (!anyOpen) return;
  
  const target = e.target as HTMLElement;
  const isInsideModalCard = target.closest(
    '#collection-modal > div, #product-modal > div, #gallery-modal > div, #video-gallery-modal > div, #ship-modal > div, #crop-modal > div, #order-details-modal > div, #user-details-modal > div'
  );
  if (!isInsideModalCard) {
    e.preventDefault();
  }
};

document.addEventListener('wheel', handleWheel, { passive: false });
document.addEventListener('touchmove', handleTouch, { passive: false });

// Toast notification helper
export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `px-4.5 py-3 rounded-2xl text-xs font-bold text-white shadow-xl pointer-events-auto transition-all duration-300 transform translate-y-4 opacity-0 flex items-center gap-2 border ${
    type === 'success' ? 'bg-emerald-500/90 border-emerald-450' : 'bg-rose-500/90 border-rose-450'
  }`;
  toast.innerHTML = `
    <span class="text-sm">${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  // Trigger reflow & animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });
  
  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Safely escapes HTML special characters to prevent Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convert Blob to Base64 string

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Image compression
export async function compressImage(file: File, quality = 0.92, maxDimension = 3000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

// Compress and upload image with optional progress callback
export async function handleImageUpload(
  file: File,
  prefix = 'product',
  onProgress?: (status: string, percent: number) => void,
  options: { quality?: number; maxDimension?: number; folder?: string } = {}
): Promise<string> {
  const isHero = prefix.toLowerCase().includes('hero') || options.folder?.toLowerCase().includes('hero');
  const quality = options.quality ?? (isHero ? 0.98 : 0.92);
  const maxDimension = options.maxDimension ?? (isHero ? 3840 : 3000);
  const targetFolder = options.folder ?? (isHero ? 'hero/gallery' : 'products/gallery');

  if (onProgress) onProgress(isHero ? 'Optimizando imagen para Hero (Alta Fidelidad)...' : 'Comprimiendo imagen a WebP...', 25);
  const compressedBlob = await compressImage(file, quality, maxDimension);

  if (onProgress) onProgress('Codificando imagen...', 55);
  const base64Data = await blobToBase64(compressedBlob);

  const cleanPrefix = prefix
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40) || 'product';

  const fileName = `${cleanPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;

  if (onProgress) onProgress('Subiendo a Firebase Storage...', 80);
  const { data, error } = await actions.uploadImage({ base64Data, fileName, folder: targetFolder });
  if (error || !data?.success || !data?.url) {
    throw new Error(error?.message || 'Error al subir la imagen.');
  }

  if (onProgress) onProgress('¡Subida completada!', 100);
  return data.url;
}

