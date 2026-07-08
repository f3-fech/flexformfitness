import { map } from 'nanostores';
import { actions } from 'astro:actions';
import { auth } from '../lib/firebaseClient';

export interface CartItem {
  productId: string;
  variantSku?: string | null;
  title: string;
  variantName?: string | null;
  quantity: number;
  price: number; // in cents
  image?: string | null;
}

// Map store to hold active cart items indexed by a unique key (productId + optional variantSku)
export const cartStore = map<Record<string, CartItem>>({});

// Keep track of current user ID and auth initialization state
let currentUid: string | null = null;
let isAuthInitialized = false;
let isSyncing = false; // Flag to prevent write-back during load/initialization

// Helper to save cart (either to localStorage or DB)
async function persistCart(cart: Record<string, CartItem>) {
  if (typeof window === 'undefined') return;

  if (currentUid) {
    // If logged in, save to Firestore via Astro Action
    try {
      await actions.saveDbCart({ items: cart });
    } catch (err) {
      console.error('Error saving cart to DB:', err);
    }
  } else {
    // If guest, save to localStorage
    try {
      localStorage.setItem('flexform_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }
}

// Load and subscribe from client side
if (typeof window !== 'undefined') {
  // Subscribe to auth state changes to load and sync cart
  auth.onAuthStateChanged(async (firebaseUser) => {
    isAuthInitialized = true;

    if (firebaseUser) {
      const prevUid = currentUid;
      currentUid = firebaseUser.uid;

      if (prevUid !== firebaseUser.uid) {
        // User logged in or switched
        try {
          isSyncing = true; // Block write-back during load
          const cacheKey = `flexform_cart_cache_${firebaseUser.uid}`;
          const cached = sessionStorage.getItem(cacheKey);

          if (cached) {
            // Load immediately from sessionStorage cache to avoid Firestore request
            cartStore.set(JSON.parse(cached));
          } else {
            // 1. Load guest cart from localStorage
            let guestCart: Record<string, CartItem> = {};
            try {
              const saved = localStorage.getItem('flexform_cart');
              if (saved) {
                guestCart = JSON.parse(saved);
              }
            } catch (err) {
              console.error('Error loading guest cart:', err);
            }

            // 2. Fetch cart from Firestore
            const { data, error } = await actions.getDbCart();
            let dbCart: Record<string, CartItem> = {};
            if (data && !error) {
              dbCart = data as Record<string, CartItem>;
            }

            // 3. Merge guest cart into db cart
            const mergedCart = { ...dbCart };
            let hasMerged = false;
            for (const [key, guestItem] of Object.entries(guestCart)) {
              hasMerged = true;
              if (mergedCart[key]) {
                mergedCart[key].quantity += guestItem.quantity;
              } else {
                mergedCart[key] = guestItem;
              }
            }

            // 4. Update store and write cache to sessionStorage
            cartStore.set(mergedCart);
            sessionStorage.setItem(cacheKey, JSON.stringify(mergedCart));

            if (hasMerged) {
              // 5. Save merged cart to DB and clear localStorage
              await actions.saveDbCart({ items: mergedCart });
              localStorage.removeItem('flexform_cart');
            }
          }
        } catch (err) {
          console.error('Error syncing cart on login:', err);
        } finally {
          isSyncing = false;
        }
      }
    } else {
      // User logged out or is guest
      const wasLoggedIn = currentUid !== null;
      const oldUid = currentUid;
      currentUid = null;

      if (wasLoggedIn) {
        // If they were logged in and logged out, clear cart store, cache and localStorage
        try {
          isSyncing = true;
          cartStore.set({});
          if (oldUid) {
            sessionStorage.removeItem(`flexform_cart_cache_${oldUid}`);
          }
          localStorage.removeItem('flexform_cart');
        } finally {
          isSyncing = false;
        }
      } else {
        // First load as guest, load cart from localStorage
        try {
          isSyncing = true;
          const saved = localStorage.getItem('flexform_cart');
          if (saved) {
            cartStore.set(JSON.parse(saved));
          }
        } catch (err) {
          console.error('Error loading cart from localStorage:', err);
        } finally {
          isSyncing = false;
        }
      }
    }
  });

  // Watch store changes to trigger persistCart
  let syncTimeout: any = null;
  
  // Function to instantly write pending sync changes
  const flushSync = () => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
      persistCart(cartStore.get());
    }
  };

  // Flush any pending updates when the page is being closed or navigated away
  window.addEventListener('beforeunload', flushSync);

  cartStore.subscribe((cart) => {
    // Only persist if auth has initialized and we are not in initialization phase
    if (!isAuthInitialized || isSyncing) return;

    // Immediately cache updated cart in sessionStorage to keep UI updated across pages
    if (currentUid) {
      try {
        sessionStorage.setItem(`flexform_cart_cache_${currentUid}`, JSON.stringify(cart));
      } catch (err) {
        console.error('Error saving cart to sessionStorage:', err);
      }
    }

    // Debounce database calls slightly to avoid spamming the DB on fast clicks
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      persistCart(cart);
      syncTimeout = null;
    }, 400);
  });
}

/**
 * Add an item to the shopping cart
 */
export function addToCart(item: CartItem) {
  const key = item.variantSku ? `${item.productId}_${item.variantSku}` : item.productId;
  const currentCart = cartStore.get();
  const existingItem = currentCart[key];

  if (existingItem) {
    cartStore.setKey(key, {
      ...existingItem,
      quantity: existingItem.quantity + item.quantity,
    });
  } else {
    cartStore.setKey(key, item);
  }
}

/**
 * Remove an item from the shopping cart
 */
export function removeFromCart(key: string) {
  const newCart = { ...cartStore.get() };
  delete newCart[key];
  cartStore.set(newCart);
}

/**
 * Set exact quantity of an item
 */
export function updateQuantity(key: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(key);
    return;
  }
  const currentItem = cartStore.get()[key];
  if (currentItem) {
    cartStore.setKey(key, { ...currentItem, quantity });
  }
}

/**
 * Empty the cart
 */
export function clearCart() {
  cartStore.set({});
}
