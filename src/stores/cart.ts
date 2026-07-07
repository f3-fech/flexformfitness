import { map } from 'nanostores';

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

// Load from localStorage on client side
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('flexform_cart');
    if (saved) {
      cartStore.set(JSON.parse(saved));
    }
  } catch (err) {
    console.error('Error loading cart from localStorage:', err);
  }

  // Auto-save changes to localStorage
  cartStore.subscribe((cart) => {
    try {
      localStorage.setItem('flexform_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
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
