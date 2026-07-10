import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateQuantity } from '../stores/cart';
import { actions } from 'astro:actions';
import { useTranslations } from '../lib/i18n';

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

  const handleApplyPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const { data, error } = await actions.validatePromoCode({ code: promoCodeInput.trim() });
      if (error) {
        throw new Error(error.message || (isEn ? 'Invalid discount code.' : 'Código de descuento no válido.'));
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
        <a href={`/${lang}`} className="mt-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-md">
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
              <li key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6">
                <div className="flex gap-4 sm:gap-6 items-center flex-1 min-w-0">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 shadow-3xs shrink-0 bg-slate-50" />
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                      {item.title}
                    </h3>
                    {item.variantName && (
                      <p className="text-xs font-bold text-brand-600 mt-1.5 uppercase tracking-wider">{item.variantName}</p>
                    )}
                    <p className="text-xs font-semibold text-slate-400 mt-1.5 sm:hidden">
                      {t('cart.unit_price')}: ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="px-3 py-1.5 text-slate-500 hover:bg-white hover:shadow-3xs rounded-lg transition-all font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold font-mono text-slate-800">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="px-3 py-1.5 text-slate-500 hover:bg-white hover:shadow-3xs rounded-lg transition-all font-bold text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Total Price for this item */}
                  <div className="text-right hidden sm:block min-w-[80px]">
                    <p className="text-base sm:text-lg font-black text-slate-950">
                      ${((item.price * item.quantity) / 100).toFixed(2)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-3xs text-slate-400 font-medium mt-0.5">
                        ${(item.price / 100).toFixed(2)} {t('cart.price_each')}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.key)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title={isEn ? "Remove item" : "Eliminar producto"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Continue Shopping button */}
        <div className="border-t border-slate-100 pt-6 mt-2 flex justify-between items-center">
          <a href={`/${lang}`} className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 transition-colors">
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
            <span className="text-slate-900 font-bold">${(subtotal / 100).toFixed(2)}</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 items-center">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.178-5.178a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                {isEn ? `Coupon ${appliedPromo.code}` : `Cupón ${appliedPromo.code}`}
              </span>
              <div className="flex items-center gap-1">
                <span>-${(discountAmount / 100).toFixed(2)}</span>
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
              {shipping === 0 ? t('cart.free') : `$${(shipping / 100).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Promo code input form */}
        <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
          {!appliedPromo ? (
            <form onSubmit={handleApplyPromoCode} className="flex gap-2 w-full">
              <input
                type="text"
                placeholder={t('cart.promo_placeholder')}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600 uppercase font-black tracking-wide text-xs"
                disabled={promoLoading}
              />
              <button
                type="submit"
                disabled={promoLoading || !promoCodeInput.trim()}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase transition-colors shrink-0 disabled:opacity-50"
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
          <span className="text-2xl text-brand-900">${(total / 100).toFixed(2)}</span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleCheckout}
          className="w-full py-4 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-center tracking-wide transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
