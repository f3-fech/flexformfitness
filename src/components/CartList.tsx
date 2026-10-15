import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateQuantity } from '../stores/cart';
import { actions } from 'astro:actions';
import { useTranslations } from '../lib/i18n';
import { getColorHex, isLightColor } from '../lib/utils';

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

  // Auto-validate cart items against database on mount to auto-remove deleted products
  useEffect(() => {
    if (cartItems.length === 0) return;
    let isMounted = true;

    (async () => {
      try {
        const { data } = await actions.validateCartItems({
          items: cartItems.map((item) => ({
            key: item.key,
            productId: item.productId,
            variantSku: item.variantSku || null,
            title: item.title,
          })),
        });

        if (isMounted && data && !data.valid && data.removedKeys.length > 0) {
          data.removedKeys.forEach((key: string) => {
            removeFromCart(key);
          });
          const titlesList = data.removedTitles.filter(Boolean).join(', ');
          const notice = isEn
            ? `Items no longer available (${titlesList}) were automatically removed from your cart.`
            : `Los productos no disponibles (${titlesList}) han sido retirados automáticamente de tu carrito.`;
          setError(notice);
        }
      } catch (err) {
        console.error('Error validating cart items on mount:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
        // Auto-remove the deleted product from local cart immediately
        if (data.removedKey) {
          removeFromCart(data.removedKey);
        } else if (data.missingProductId) {
          const fallbackKey = data.missingVariantSku 
            ? `${data.missingProductId}_${data.missingVariantSku}` 
            : data.missingProductId;
          removeFromCart(fallbackKey);
        }
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
      <div className="text-center py-20 flex flex-col items-center gap-4 bg-white rounded-none border border-slate-200 p-8 sm:p-12">
        <div className="w-14 h-14 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-bold tracking-[0.16em] uppercase text-slate-900">{t('cart.empty')}</h2>
        <p className="text-slate-500 text-xs max-w-xs leading-relaxed font-normal">{t('cart.empty_desc')}</p>
        <a href={`/${lang}`} className="mt-2 py-3 px-8 rounded-none bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-[0.2em] transition-colors">
          {t('cart.back_to_shop')}
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* Items List */}
      <div className="lg:col-span-8 bg-white rounded-none border border-slate-200 p-5 sm:p-7 flex flex-col gap-6">
        <div className="flow-root">
          <ul className="divide-y divide-slate-100 -my-5">
            {cartItems.map((item) => (
              <li key={item.key} className="py-5 flex gap-4 sm:gap-6 items-start">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-20 h-24 sm:w-24 sm:h-28 rounded-none object-cover border border-slate-200 shrink-0 bg-slate-50" 
                  />
                )}
                
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-3">
                  {/* Top Row: Title + Minimalist Variant Badges & Delete Button */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <h3 className="font-bold text-slate-950 text-xs sm:text-sm tracking-[0.14em] uppercase leading-snug">
                        {item.title}
                      </h3>

                      {item.variantName && (() => {
                        const parts = item.variantName.split('/').map((p) => p.trim());
                        if (parts.length === 2) {
                          const [color, size] = parts;
                          const hex = getColorHex(color);
                          return (
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {/* Color Box */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded-none text-[11px] font-mono uppercase text-slate-900">
                                <span 
                                  className="w-2.5 h-2.5 rounded-none border border-black/20 shrink-0" 
                                  style={{ backgroundColor: hex }}
                                  title={color}
                                />
                                <span className="font-medium">{color}</span>
                              </div>
                              {/* Size Box */}
                              <div className="inline-flex items-center px-2 py-0.5 bg-white border border-slate-300 rounded-none text-[11px] font-mono font-bold uppercase text-slate-950">
                                <span>{isEn ? `SIZE: ${size.toUpperCase()}` : `TALLA: ${size.toUpperCase()}`}</span>
                              </div>
                            </div>
                          );
                        }
                        const hex = getColorHex(item.variantName);
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded-none text-[11px] font-mono uppercase text-slate-900">
                              <span 
                                className="w-2.5 h-2.5 rounded-none border border-black/20 shrink-0" 
                                style={{ backgroundColor: hex }}
                                title={item.variantName}
                              />
                              <span className="font-medium">{item.variantName}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Delete button (Top Right) */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="p-1 text-slate-400 hover:text-black transition-colors rounded-none shrink-0 cursor-pointer"
                      title={isEn ? "Remove item" : "Eliminar producto"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Bottom Row: Quantity Controls & Price */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    {/* Minimalist Quantity Controls */}
                    <div className="flex items-center border border-slate-300 rounded-none bg-white shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors font-medium text-xs cursor-pointer select-none"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-medium text-slate-900 select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors font-medium text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
                        title={item.maxStock !== undefined && item.quantity >= item.maxStock ? (isEn ? "Maximum stock reached" : "Sin más stock disponible") : undefined}
                      >
                        +
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right flex flex-col justify-end">
                      <p className="text-sm sm:text-base font-semibold text-slate-950 font-mono leading-none">
                        {((item.price * item.quantity) / 100).toFixed(2)} €
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1 leading-none">
                          {(item.price / 100).toFixed(2)} € x{item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue Shopping button */}
        <div className="border-t border-slate-200/80 pt-4 mt-1 flex justify-between items-center">
          <a href={`/${lang}`} className="text-xs font-semibold tracking-wider uppercase text-slate-600 hover:text-black flex items-center gap-1.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {t('cart.continue_shopping')}
          </a>
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-4 p-5 sm:p-7 bg-white rounded-none border border-slate-200 flex flex-col gap-5">
        <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-slate-950 pb-2 border-b border-slate-100">
          {t('cart.summary')}
        </h3>

        {error && (
          <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-b border-slate-200/80 pb-4 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider">{t('cart.subtotal')}</span>
            <span className="text-slate-950 font-mono font-medium">{(subtotal / 100).toFixed(2)} €</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between text-emerald-700 font-medium bg-emerald-50/60 p-2 rounded-none border border-emerald-200/60 items-center">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-emerald-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.178-5.178a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                {isEn ? `Code: ${appliedPromo.code}` : `Código: ${appliedPromo.code}`}
              </span>
              <div className="flex items-center gap-1 font-mono">
                <span>-{(discountAmount / 100).toFixed(2)} €</span>
                <button
                  type="button"
                  onClick={handleRemovePromoCode}
                  className="text-rose-600 hover:text-black text-xs font-bold ml-1 px-1 transition-colors cursor-pointer"
                  title={isEn ? "Remove coupon" : "Eliminar cupón"}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider">{t('cart.shipping')}</span>
            <span className="text-slate-950 font-mono font-medium">
              {shipping === 0 ? t('cart.free') : `${(shipping / 100).toFixed(2)} €`}
            </span>
          </div>
        </div>

        {/* Promo code input form */}
        <div className="flex flex-col gap-1.5 border-b border-slate-200/80 pb-4">
          {!appliedPromo ? (
            <form onSubmit={handleApplyPromoCode} className="w-full flex items-center bg-white border border-slate-300 focus-within:border-black rounded-none transition-colors">
              <input
                type="text"
                placeholder={t('cart.promo_placeholder')}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-3 py-2 text-slate-900 focus:outline-none uppercase font-bold tracking-wider text-xs placeholder:text-slate-400 placeholder:normal-case placeholder:font-normal rounded-none"
                disabled={promoLoading}
              />
              <button
                type="submit"
                disabled={promoLoading || !promoCodeInput.trim()}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-none text-[10px] font-bold uppercase tracking-[0.16em] transition-colors shrink-0 disabled:opacity-30 cursor-pointer"
              >
                {promoLoading ? '...' : t('cart.apply')}
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-emerald-700 font-bold tracking-wide uppercase">{t('cart.promo_success')}</p>
          )}
          {promoError && (
            <p className="text-[11px] text-rose-600 font-medium mt-0.5 leading-normal">{promoError}</p>
          )}
        </div>

        <div className="flex justify-between items-baseline font-bold text-slate-950">
          <span className="text-xs uppercase tracking-[0.16em]">{t('cart.total')}</span>
          <span className="text-lg font-mono text-slate-950">{(total / 100).toFixed(2)} €</span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleCheckout}
          className="w-full py-4 px-6 rounded-none bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-center tracking-[0.2em] uppercase text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer select-none"
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
