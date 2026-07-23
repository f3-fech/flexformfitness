export const languages = {
  es: 'Español',
  en: 'English'
};

export const defaultLang = 'es';

export const translations = {
  es: {
    'announcement.free_shipping': 'ENVÍO GRATUITO PARA PEDIDOS SUPERIORES A',
    'nav.home': 'INICIO',
    'nav.men': 'HOMBRE',
    'nav.women': 'MUJER',
    'nav.collections': 'COLECCIONES',
    'nav.contact': 'CONTACTO',
    'nav.signin': 'Iniciar Sesión',
    'nav.my_account': 'Mi Cuenta',
    'nav.signout': 'Cerrar Sesión',
    'nav.search': 'Buscar',
    'nav.cart': 'Carrito',
    'nav.hello': 'Hola',
    'nav.no_collections': 'No hay colecciones',
    'nav.all_catalog': 'Ver Todo el Catálogo',
    'nav.view_all': 'Ver Todo',
    'nav.admin_panel': 'Gestionar Carpetas (Admin)',
    
    'cart.title': 'Tu Carrito de Compra',
    'cart.empty': 'Tu carrito está vacío',
    'cart.empty_desc': 'Explora nuestra tienda y añade productos para comenzar tu entrenamiento con FlexForm.',
    'cart.back_to_shop': 'Volver a la Tienda',
    'cart.continue_shopping': 'Continuar Comprando',
    'cart.summary': 'Resumen del Pedido',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Envío',
    'cart.free': 'Gratis',
    'cart.total': 'Total',
    'cart.checkout': 'Proceder al Pago',
    'cart.promo_placeholder': 'Código de descuento',
    'cart.apply': 'Aplicar',
    'cart.promo_success': '¡Descuento aplicado con éxito!',
    'cart.remove_promo': 'Eliminar cupón',
    'cart.price_each': 'c/u',
    'cart.unit_price': 'Precio',
    
    'product.add_to_cart': 'Añadir al Carrito',
    'product.out_of_stock': 'Agotado',
    'product.fast_shipping': 'Envío Rápido a Domicilio',
    'product.fast_shipping_desc': 'Recibe tu pedido de 2 a 5 días hábiles con seguimiento completo.',
    'product.premium_quality': 'Calidad Deportiva Premium',
    'product.premium_quality_desc': 'Tejidos de alta gama diseñados para resistir entrenamientos intensos.',
    'product.safe_checkout': 'Pago 100% Seguro',
    'product.safe_checkout_desc': 'Transacciones encriptadas con Stripe. Admite tarjetas de crédito y Apple Pay.',
    'product.color': 'Color',
    'product.size': 'Talla',
    'product.quantity': 'Cantidad',
    'product.id': 'ID del Producto',
    
    'auth.login_title': 'Iniciar Sesión',
    'auth.register_title': 'Crear Cuenta',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.no_account': '¿No tienes cuenta? Regístrate aquí',
    'auth.has_account': '¿Ya tienes cuenta? Inicia sesión aquí',
    
    'account.welcome': 'Hola, {name}',
    'account.logout': 'Cerrar Sesión',
    'account.orders': 'Mis Pedidos',
    'account.no_orders': 'Aún no has realizado ningún pedido.'
  },
  en: {
    'announcement.free_shipping': 'FREE SHIPPING ON ORDERS OVER',
    'nav.home': 'HOME',
    'nav.men': 'MEN',
    'nav.women': 'WOMEN',
    'nav.collections': 'COLLECTIONS',
    'nav.contact': 'CONTACT',
    'nav.signin': 'Sign In',
    'nav.my_account': 'My Account',
    'nav.signout': 'Sign Out',
    'nav.search': 'Search',
    'nav.cart': 'Cart',
    'nav.hello': 'Hello',
    'nav.no_collections': 'No collections available',
    'nav.all_catalog': 'View All Catalog',
    'nav.view_all': 'View All',
    'nav.admin_panel': 'Manage Folders (Admin)',
    
    'cart.title': 'Your Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_desc': 'Explore our store and add products to start your workout with FlexForm.',
    'cart.back_to_shop': 'Back to Shop',
    'cart.continue_shopping': 'Continue Shopping',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.free': 'Free',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.promo_placeholder': 'Discount code',
    'cart.apply': 'Apply',
    'cart.promo_success': 'Discount applied successfully!',
    'cart.remove_promo': 'Remove coupon',
    'cart.price_each': 'each',
    'cart.unit_price': 'Price',
    
    'product.add_to_cart': 'Add to Cart',
    'product.out_of_stock': 'Out of Stock',
    'product.fast_shipping': 'Fast Home Shipping',
    'product.fast_shipping_desc': 'Receive your order in 2 to 5 business days with full tracking.',
    'product.premium_quality': 'Premium Quality Sportswear',
    'product.premium_quality_desc': 'High-end fabrics designed to withstand intense workouts.',
    'product.safe_checkout': '100% Safe Checkout',
    'product.safe_checkout_desc': 'Encrypted transactions with Stripe. Credit cards & Apple Pay.',
    'product.color': 'Color',
    'product.size': 'Size',
    'product.quantity': 'Quantity',
    'product.id': 'Product ID',
    
    'auth.login_title': 'Sign In',
    'auth.register_title': 'Create Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.no_account': "Don't have an account? Sign up here",
    'auth.has_account': 'Already have an account? Sign in here',
    
    'account.welcome': 'Hello, {name}',
    'account.logout': 'Sign Out',
    'account.orders': 'My Orders',
    'account.no_orders': 'You have not placed any orders yet.'
  }
} as const;

export type TranslationKey = keyof typeof translations['es'];

export function useTranslations(lang: string | undefined) {
  const currentLang = (lang === 'en' ? 'en' : 'es') as 'es' | 'en';
  return function t(key: TranslationKey, replacements?: Record<string, string>): string {
    let text: string = translations[currentLang][key] || translations[defaultLang][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };
}
