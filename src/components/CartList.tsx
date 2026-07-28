import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateQuantity } from '../stores/cart';
import { actions } from 'astro:actions';
import { useTranslations } from '../lib/i18n';

const getColorHex = (colorName: string): string => {
  const name = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    'negro': '#0f172a',
    'black': '#0f172a',
    'gris': '#94a3b8',
    'grey': '#94a3b8',
    'gray': '#94a3b8',
    'gris oscuro': '#4b5563',
    'gris-oscuro': '#4b5563',
    'rosa': '#db2777',
    'pink': '#db2777',
    'rojo': '#dc2626',
    'red': '#dc2626',
    'azul marino': '#1e3a8a',
    'azul-marino': '#1e3a8a',
    'marino': '#1e3a8a',
    'navy': '#1e3a8a',
    'azul': '#2563eb',
    'blue': '#2563eb',
    'verde': '#16a34a',
    'green': '#16a34a',
    'blanco': '#ffffff',
    'white': '#ffffff',
    'amarillo': '#ca8a04',
    'yellow': '#ca8a04',
    'lila': '#d8b4fe',
    'lavender': '#d8b4fe',
    'naranja': '#ea580c',
    'orange': '#ea580c',
    'marron': '#78350f',
    'marrón': '#78350f',
    'brown': '#78350f',
    'beige': '#f5f5dc',
    'celeste': '#38bdf8',
    'unisex': '#64748b'
  };
  
  for (const key in colorMap) {
    if (name.includes(key)) {
      return colorMap[key];
    }
  }
  return '#94a3b8';
};

interface CartListProps {
  shippingPrice?: number;
  freeShippingMin?: number;
  lang?: string;
}

export const CartList: React.FC<CartListProps> = ({ shippingPrice = 499, freeShippingMin = 5000, lang = 'es' }) => {
  const t = useTranslations(lang);
  const isEn = lang === 'en';
  const cart = useStore(cartStore);
  
  const cartItems = Object.keys(cart).map((key) => ({
    key,
    ...cart[key],
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo) {
    const { percent_off, amount_off } = appliedPromo.coupon;
    if (percent_off) {
      discountAmount = Math.round(subtotal * (percent_off / 100));
    } else if (amount_off) {
      discountAmount = Math.min(amount_off, subtotal);
    }
  }
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const shipping = subtotalAfterDiscount >= freeShippingMin || subtotal === 0 ? 0 : shippingPrice;
  const total = subtotalAfterDiscount + shipping;

  // Auto-remove shipping promo code if user adds items and subtotal becomes >= freeShippingMin
  useEffect(() => {
    if (appliedPromo) {
      const isShipping = appliedPromo.isShippingCoupon || 
        appliedPromo.coupon?.amount_off === shippingPrice || 
        appliedPromo.code?.includes('ENVIO') ||
        appliedPromo.code?.includes('FREESHIP') ||
        appliedPromo.code?.includes('SHIPPING') ||
        appliedPromo.code?.includes('GRATIS');
      
      if (isShipping && subtotal >= freeShippingMin) {
        setAppliedPromo(null);
        setPromoError(isEn ? 'Shipping discount code removed because your order already has free shipping.' : 'Código de envío gratis eliminado porque tu pedido ya dispone de envío gratuito.');
      }
    }
  }, [subtotal, freeShippingMin, appliedPromo, shippingPrice, isEn]);

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const { data, error } = await actions.validatePromoCode({ 
        code: promoCodeInput.trim(), 
        subtotal 
      });
      if (error) {
        throw new Error(error.message || (isEn ? 'Invalid discount code.' : 'Código de descuento no válido.'));
      }

      const isShipping = data.isShippingCoupon || 
        data.coupon?.amount_off === shippingPrice || 
        data.code?.includes('ENVIO') ||
        data.code?.includes('FREESHIP') ||
        data.code?.includes('SHIPPING') ||
        data.code?.includes('GRATIS');

      if (isShipping && subtotal >= freeShippingMin) {
        const minFormatted = (freeShippingMin / 100).toFixed(2);
        throw new Error(isEn ? `Shipping discount code can only be used for orders under ${minFormatted} €.` : `Este código de envío gratis solo es aplicable en compras inferiores a ${minFormatted} € (tu pedido ya dispone de envío gratuito).`);
      }

      setAppliedPromo(data);
      setPromoCodeInput('');
    } catch (err: any) {
      setPromoError(err.message || (isEn ? 'Error validating the discount code.' : 'Error al validar el código.'));
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            title: item.title,
            quantity: item.quantity,
          })),
          promoCodeId: appliedPromo?.id || undefined,
          lang: lang || 'es',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Something went wrong during checkout.' : 'Algo salió mal durante el checkout.'));
      }

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout page
      } else {
        throw new Error(isEn ? 'Stripe Checkout URL not received.' : 'No se recibió la URL de Stripe Checkout.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isEn ? 'Network error. Try again.' : 'Error de red. Inténtalo de nuevo.'));
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t('cart.empty')}</h2>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{t('cart.empty_desc')}</p>
        <a href={`/${lang}`} className="mt-2 py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md">
          {t('cart.back_to_shop')}
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Items List */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        <div className="flow-root">
          <ul className="divide-y divide-slate-100 -my-6">
            {cartItems.map((item) => (
              <li key={item.key} className="py-6 flex gap-4 sm:gap-6 items-start">
                {item.image && (
                  <img src={item.image} alt={item.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 shadow-3xs shrink-0 bg-slate-50" />
                )}
                
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-3">
                  {/* Top Row: Title + Variant Circles (Left) & Delete Button (Top-Right) */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                        {item.title}
                      </h3>
                      {item.variantName && (() => {
                        const parts = item.variantName.split('/').map((p) => p.trim());
                        if (parts.length === 2) {
                          const [color, size] = parts;
                          const hex = getColorHex(color);
                          return (
                            <div className="flex items-center gap-2">
                              {/* Color Swatch Perfect Circle */}
                              <span 
                                className="w-6 h-6 rounded-full aspect-square shrink-0 border border-slate-300 shadow-3xs inline-block" 
                                style={{ backgroundColor: hex }}
                                title={color}
                              />
                              {/* Size Perfect Circle */}
                              <span 
                                className="w-6 h-6 rounded-full aspect-square shrink-0 bg-slate-100 border border-slate-200 text-slate-950 font-black text-xs leading-none uppercase flex items-center justify-center shadow-3xs" 
                                title={isEn ? `Size ${size}` : `Talla ${size}`}
                              >
                                {size}
                              </span>
                            </div>
                          );
                        }
                        const hex = getColorHex(item.variantName);
                        return (
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-6 h-6 rounded-full aspect-square shrink-0 border border-slate-300 shadow-3xs inline-block" 
                              style={{ backgroundColor: hex }}
                              title={item.variantName}
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Delete button (Top Right) */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 -mt-1"
                      title={isEn ? "Remove item" : "Eliminar producto"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Bottom Row: Quantity Controls (Left) & Price (Bottom Right Corner!) */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-white hover:shadow-3xs rounded-lg transition-all font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold font-mono text-slate-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                        className="px-2.5 py-1 text-slate-500 hover:bg-white hover:shadow-3xs rounded-lg transition-all font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
                        title={item.maxStock !== undefined && item.quantity >= item.maxStock ? (isEn ? "Maximum stock reached" : "Sin más stock disponible") : undefined}
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price (Bottom Right Corner!) */}
                    <div className="text-right flex flex-col justify-end">
                      <p className="text-base sm:text-lg font-black text-slate-950 leading-none">
                        {((item.price * item.quantity) / 100).toFixed(2)} €
                      </p>
                      <p className="text-3xs text-slate-400 font-semibold mt-1 h-3 leading-none">
                        {item.quantity > 1 ? `${(item.price / 100).toFixed(2)} € x${item.quantity}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue Shopping button */}
        <div className="border-t border-slate-100 pt-6 mt-2 flex justify-between items-center">
          <a href={`/${lang}`} className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {t('cart.continue_shopping')}
          </a>
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-4 p-6 sm:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
        <h3 className="font-extrabold text-lg text-slate-900">{t('cart.summary')}</h3>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 text-sm text-slate-600 font-medium">
          <div className="flex justify-between">
            <span>{t('cart.subtotal')}</span>
            <span className="text-slate-900 font-bold">{(subtotal / 100).toFixed(2)} €</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 items-center">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.178-5.178a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                {isEn ? `Coupon ${appliedPromo.code}` : `Cupón ${appliedPromo.code}`}
              </span>
              <div className="flex items-center gap-1">
                <span>-{(discountAmount / 100).toFixed(2)} €</span>
                <button
                  type="button"
                  onClick={handleRemovePromoCode}
                  className="text-rose-500 hover:text-rose-600 text-sm font-extrabold ml-1 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                  title={isEn ? "Remove coupon" : "Eliminar cupón"}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <span>{t('cart.shipping')}</span>
            <span className="text-slate-900 font-bold">
              {shipping === 0 ? t('cart.free') : `${(shipping / 100).toFixed(2)} €`}
            </span>
          </div>
        </div>

        {/* Promo code input form */}
        <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
          {!appliedPromo ? (
            <form onSubmit={handleApplyPromoCode} className="w-full flex items-center bg-slate-50 border border-slate-200 focus-within:border-rose-600 rounded-xl p-1 transition-colors overflow-hidden">
              <input
                type="text"
                placeholder={t('cart.promo_placeholder')}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-2.5 py-1 text-slate-900 focus:outline-none uppercase font-bold tracking-wider text-xs placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal"
                disabled={promoLoading}
              />
              <button
                type="submit"
                disabled={promoLoading || !promoCodeInput.trim()}
                className="px-3 py-1.5 bg-slate-950 hover:bg-rose-600 text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
              >
                {promoLoading ? '...' : t('cart.apply')}
              </button>
            </form>
          ) : (
            <p className="text-2xs text-emerald-600 font-bold tracking-wide uppercase">{t('cart.promo_success')}</p>
          )}
          {promoError && (
            <p className="text-3xs text-rose-500 font-bold mt-1 leading-normal">{promoError}</p>
          )}
        </div>

        <div className="flex justify-between items-baseline font-extrabold text-slate-900 text-lg">
          <span>{t('cart.total')}</span>
          <span className="text-2xl text-slate-950">{(total / 100).toFixed(2)} €</span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleCheckout}
          className="w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-rose-600 text-white font-extrabold text-center tracking-wider uppercase text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isEn ? 'Processing...' : 'Procesando...'}
            </>
          ) : (
            t('cart.checkout')
          )}
        </button>
      </div>
    </div>
  );
};
