import { map } from 'nanostores';

const cartStore = map({});
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("flexform_cart");
    if (saved) {
      cartStore.set(JSON.parse(saved));
    }
  } catch (err) {
    console.error("Error loading cart from localStorage:", err);
  }
  cartStore.subscribe((cart) => {
    try {
      localStorage.setItem("flexform_cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  });
}
function addToCart(item) {
  const key = item.variantSku ? `${item.productId}_${item.variantSku}` : item.productId;
  const currentCart = cartStore.get();
  const existingItem = currentCart[key];
  if (existingItem) {
    cartStore.setKey(key, {
      ...existingItem,
      quantity: existingItem.quantity + item.quantity
    });
  } else {
    cartStore.setKey(key, item);
  }
}
function removeFromCart(key) {
  const newCart = { ...cartStore.get() };
  delete newCart[key];
  cartStore.set(newCart);
}
function updateQuantity(key, quantity) {
  if (quantity <= 0) {
    removeFromCart(key);
    return;
  }
  const currentItem = cartStore.get()[key];
  if (currentItem) {
    cartStore.setKey(key, { ...currentItem, quantity });
  }
}

export { addToCart as a, cartStore as c, removeFromCart as r, updateQuantity as u };
