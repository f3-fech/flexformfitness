import React, { useState, useEffect, useMemo } from 'react';
import { type Product, type ProductVariant } from '../types';
import { addToCart } from '../stores/cart';
import { getColorHex, isLightColor } from '../lib/utils';
import { actions } from 'astro:actions';

interface ProductSelectorProps {
  product: Product;
  lang?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ product, lang = 'es' }) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const isEn = lang === 'en';

  // 1. Build a lookup map of color name -> hex from the product's actual variants
  const colorHexByOption = useMemo(() => {
    const map = new Map<string, string>();
    if (hasVariants) {
      product.variants.forEach((v) => {
        const parts = v.name.split('/').map((p) => p.trim());
        const colorPart = parts[0];
        if (colorPart && v.colorHex && !map.has(colorPart.toLowerCase())) {
          map.set(colorPart.toLowerCase(), v.colorHex);
        }
      });
    }
    return map;
  }, [product.variants, hasVariants]);

  // Helper to resolve color hex from product variant or rich color dictionary
  const resolveOptionColorHex = (colorName: string): string => {
    const normalized = colorName.toLowerCase().trim();
    if (colorHexByOption.has(normalized)) {
      return colorHexByOption.get(normalized)!;
    }
    return getColorHex(colorName);
  };

  // 2. Group variant values into option groups (Option 1 = Color, Option 2 = Size)
  const optionGroups: { name: string; isColor: boolean; values: string[] }[] = [];
  
  if (hasVariants) {
    const opt1Values = new Set<string>();
    const opt2Values = new Set<string>();
    
    product.variants.forEach((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      if (parts[0]) opt1Values.add(parts[0]);
      if (parts[1]) opt2Values.add(parts[1]);
    });
    
    if (opt1Values.size > 0) {
      optionGroups.push({
        name: isEn ? 'Color' : 'Color',
        isColor: true,
        values: Array.from(opt1Values),
      });
    }
    
    if (opt2Values.size > 0) {
      optionGroups.push({
        name: isEn ? 'Size' : 'Talla',
        isColor: false,
        values: Array.from(opt2Values),
      });
    }
  }

  // 3. State for active options & modals
  const [selectedOpt1, setSelectedOpt1] = useState<string>(
    optionGroups[0]?.values[0] || ''
  );
  const [selectedOpt2, setSelectedOpt2] = useState<string>(
    optionGroups[1]?.values[0] || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState<boolean>(false);
  const [notifyContact, setNotifyContact] = useState<string>('');
  const [notifySent, setNotifySent] = useState<boolean>(false);

  // 4. Find matching variant based on current selectors
  let selectedVariant: ProductVariant | null = null;
  if (hasVariants) {
    selectedVariant = product.variants.find((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      if (optionGroups.length === 2) {
        return parts[0] === selectedOpt1 && parts[1] === selectedOpt2;
      } else {
        return parts[0] === selectedOpt1;
      }
    }) || null;

    if (!selectedVariant) {
      selectedVariant = product.variants.find((v) => {
        const parts = v.name.split('/').map((p) => p.trim());
        return parts[0] === selectedOpt1;
      }) || product.variants[0];
    }
  }

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const isOutOfStock = currentStock <= 0;

  // 5. Update main product image and desaturation overlay in parent DOM when variant changes
  useEffect(() => {
    if (selectedVariant?.image) {
      const imgEl = document.getElementById('main-product-image') as HTMLImageElement;
      if (imgEl) {
        imgEl.src = selectedVariant.image;
      }
    }
  }, [selectedVariant]);

  // Helper: check if a specific size is available for current selected color
  const isSizeAvailable = (size: string): boolean => {
    if (optionGroups.length < 2) {
      const v = product.variants.find((v) => v.name === size);
      return v ? v.stock > 0 : product.stock > 0;
    }
    const variant = product.variants.find((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      return parts[0] === selectedOpt1 && parts[1] === size;
    });
    return variant ? variant.stock > 0 : false;
  };

  // Helper: check if a color is available (has at least 1 size with stock > 0)
  const isColorAvailable = (colorName: string): boolean => {
    if (!hasVariants) return product.stock > 0;
    const colorVariants = product.variants.filter((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      return parts[0] === colorName;
    });
    if (colorVariants.length === 0) return false;
    return colorVariants.some((v) => v.stock > 0);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart({
      productId: product.id,
      variantSku: selectedVariant?.sku || null,
      title: isEn ? (product.title_en || product.title) : product.title,
      variantName: selectedVariant?.name || null,
      quantity,
      price: currentPrice,
      image: selectedVariant?.image || product.images[0] || null,
      maxStock: currentStock,
    });

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact || isSubmittingNotify) return;

    setIsSubmittingNotify(true);
    try {
      const sizeGroup = optionGroups.find(g => !g.isColor);
      const selectedSize = sizeGroup ? (sizeGroup.name === optionGroups[0]?.name ? selectedOpt1 : selectedOpt2) : '';

      await actions.subscribeRestockNotification({
        email: notifyContact,
        productId: product.id,
        productSlug: product.slug,
        productTitle: product.title,
        size: selectedSize ? selectedSize.toUpperCase() : '',
        variant: selectedVariant?.name || `${selectedOpt1} / ${selectedOpt2}`,
        lang,
      });

      setNotifySent(true);
      setTimeout(() => {
        setNotifySent(false);
        setIsNotifyOpen(false);
        setNotifyContact('');
      }, 2500);
    } catch (err) {
      console.error('Error subscribing to restock notification:', err);
      // Give feedback even on network issue
      setNotifySent(true);
      setTimeout(() => {
        setNotifySent(false);
        setIsNotifyOpen(false);
      }, 2500);
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full select-none">
      {/* Option Selectors: Colors and Sizes (YoungLA / Minimalist High-End Style) */}
      {hasVariants && (
        <div className="flex flex-col gap-5">
          {optionGroups.map((group, groupIdx) => {
            const isColorGroup = group.isColor;
            const currentValue = groupIdx === 0 ? selectedOpt1 : selectedOpt2;
            const setValue = groupIdx === 0 ? setSelectedOpt1 : setSelectedOpt2;

            if (isColorGroup) {
              return (
                <div key={group.name} className="flex flex-col gap-2">
                  <div className="text-xs sm:text-[13px] text-slate-800 font-normal">
                    <span>{isEn ? 'Color: ' : 'Color: '}</span>
                    <span className="font-medium text-slate-950 capitalize">{currentValue}</span>
                  </div>

                  {/* Square Color Swatches with X overlay if sold out (Image 1 style) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {group.values.map((value) => {
                      const isSelected = currentValue === value;
                      const available = isColorAvailable(value);
                      const hex = resolveOptionColorHex(value);
                      const isLight = isLightColor(hex);

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setValue(value);
                            setQuantity(1);
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-none relative transition-all duration-100 flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'ring-1 ring-black ring-offset-2 ring-offset-white border border-black/20'
                              : isLight
                              ? 'border border-slate-300 hover:border-slate-800'
                              : 'border border-black/15 hover:border-black'
                          }`}
                          title={`${value} ${!available ? (isEn ? '(Sold Out)' : '(Agotado)') : ''}`}
                          aria-label={`Color ${value}`}
                        >
                          {/* Corner-to-Corner Fine X when color is completely out of stock */}
                          {!available && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <line
                                x1="0"
                                y1="0"
                                x2="100"
                                y2="100"
                                stroke={isLight ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.75)"}
                                strokeWidth="1.2"
                                vectorEffect="non-scaling-stroke"
                              />
                              <line
                                x1="100"
                                y1="0"
                                x2="0"
                                y2="100"
                                stroke={isLight ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.75)"}
                                strokeWidth="1.2"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              // Size Selector: Rectangular boxes with X when sold out + Size chart link (Image 1 style)
              return (
                <div key={group.name} className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-[13px] text-slate-800 font-normal">
                      {isEn ? 'Size:' : 'Talla:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-xs sm:text-[13px] text-slate-800 hover:text-black underline cursor-pointer font-normal tracking-tight bg-transparent border-0 p-0"
                    >
                      {isEn ? 'Size chart' : 'Guía de tallas'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {group.values.map((value) => {
                      const isSelected = currentValue === value;
                      const available = isSizeAvailable(value);

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setValue(value);
                            setQuantity(1);
                          }}
                          className={`relative w-9 h-9 sm:w-10 sm:h-10 aspect-square flex items-center justify-center text-xs sm:text-sm font-semibold tracking-normal transition-colors cursor-pointer rounded-none select-none border p-0 ${
                            isSelected
                              ? 'border-black text-slate-950 bg-white font-bold shadow-none'
                              : available
                              ? 'border-slate-300 text-slate-800 bg-white hover:border-black'
                              : 'border-slate-200 text-slate-400 bg-transparent hover:border-slate-400'
                          }`}
                        >
                          <span className="relative z-1">{value.toUpperCase()}</span>

                          {/* Corner-to-Corner Fine X when size is out of stock (Image 1 style) */}
                          {!available && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <line
                                x1="0"
                                y1="0"
                                x2="100"
                                y2="100"
                                stroke="currentColor"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                                className={isSelected ? "text-slate-950" : "text-slate-300"}
                              />
                              <line
                                x1="100"
                                y1="0"
                                x2="0"
                                y2="100"
                                stroke="currentColor"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                                className={isSelected ? "text-slate-950" : "text-slate-300"}
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Action Buttons: SOLD OUT / EMAIL WHEN AVAILABLE vs ADD TO CART (Image 3 style) */}
      <div className="flex flex-col gap-2.5 mt-2">
        {isOutOfStock ? (
          <>
            <button
              type="button"
              disabled
              className="w-full py-3.5 px-6 border border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold tracking-[0.2em] uppercase rounded-none cursor-not-allowed text-center select-none"
            >
              {isEn ? 'SOLD OUT' : 'AGOTADO'}
            </button>
            <button
              type="button"
              onClick={() => setIsNotifyOpen(true)}
              className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold tracking-[0.2em] uppercase rounded-none transition-colors text-center cursor-pointer select-none"
            >
              {isEn ? 'EMAIL OR TEXT WHEN AVAILABLE' : 'AVÍSAME CUANDO ESTÉ DISPONIBLE'}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            {/* Minimal inline quantity buttons */}
            <div className="flex items-center border border-slate-300 h-11 shrink-0 rounded-none bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-full flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors font-medium text-sm cursor-pointer"
              >
                −
              </button>
              <span className="w-8 text-center text-xs font-mono font-medium text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
                className="w-8 h-full flex items-center justify-center text-slate-600 hover:text-black hover:bg-slate-50 transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-grow h-11 px-6 bg-slate-950 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold tracking-[0.2em] uppercase rounded-none transition-all duration-150 cursor-pointer shadow-none ${
                addedFeedback ? 'bg-emerald-700 hover:bg-emerald-700' : ''
              }`}
            >
              {addedFeedback 
                ? (isEn ? 'ADDED TO CART ✓' : '¡AÑADIDO AL CARRITO! ✓') 
                : (isEn ? 'ADD TO CART' : 'AÑADIR AL CARRITO')
              }
            </button>
          </div>
        )}
      </div>

      {/* --- SIZE CHART MODAL (en cm) --- */}
      {isSizeChartOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setIsSizeChartOpen(false)}
        >
          <div 
            className="bg-white max-w-xl w-full p-6 sm:p-8 rounded-none border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-slate-900">
                {isEn ? 'Size Chart (cm)' : 'Guía de Medidas (cm)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {product.sizeMeasurements && Object.keys(product.sizeMeasurements).length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 font-medium">
                  {isEn ? 'Garment measurements in centimeters (cm):' : 'Medidas de la prenda en centímetros (cm):'}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-950 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-2 px-3 text-left">{isEn ? 'Measurement' : 'Medida (cm)'}</th>
                        {(optionGroups.find(g => !g.isColor)?.values || []).map((sz) => (
                          <th key={sz} className="py-2 px-3 uppercase font-mono">{sz.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
                      {product.sizeMeasurements.length && (
                        <tr>
                          <td className="py-2 px-3 text-left font-bold text-slate-900 font-sans">{isEn ? 'Length (cm)' : 'Largo (cm)'}</td>
                          {(optionGroups.find(g => !g.isColor)?.values || []).map((sz) => (
                            <td key={sz} className="py-2 px-3">{product.sizeMeasurements?.length?.[sz] || product.sizeMeasurements?.length?.[sz.toLowerCase()] || product.sizeMeasurements?.length?.[sz.toUpperCase()] || '-'}</td>
                          ))}
                        </tr>
                      )}
                      {product.sizeMeasurements.chest && (
                        <tr>
                          <td className="py-2 px-3 text-left font-bold text-slate-900 font-sans">{isEn ? 'Chest (cm)' : 'Pecho (cm)'}</td>
                          {(optionGroups.find(g => !g.isColor)?.values || []).map((sz) => (
                            <td key={sz} className="py-2 px-3">{product.sizeMeasurements?.chest?.[sz] || product.sizeMeasurements?.chest?.[sz.toLowerCase()] || product.sizeMeasurements?.chest?.[sz.toUpperCase()] || '-'}</td>
                          ))}
                        </tr>
                      )}
                      {product.sizeMeasurements.waist && (
                        <tr>
                          <td className="py-2 px-3 text-left font-bold text-slate-900 font-sans">{isEn ? 'Waist (cm)' : 'Cintura (cm)'}</td>
                          {(optionGroups.find(g => !g.isColor)?.values || []).map((sz) => (
                            <td key={sz} className="py-2 px-3">{product.sizeMeasurements?.waist?.[sz] || product.sizeMeasurements?.waist?.[sz.toLowerCase()] || product.sizeMeasurements?.waist?.[sz.toUpperCase()] || '-'}</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                {isEn ? 'Size guide will be available soon.' : 'Guía de medidas disponible próximamente.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RESTOCK NOTIFICATION MODAL --- */}
      {isNotifyOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setIsNotifyOpen(false)}
        >
          <div 
            className="bg-white max-w-md w-full p-6 sm:p-7 rounded-none border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-slate-900">
                {isEn ? 'Back In Stock Notification' : 'Aviso de Reposición'}
              </h3>
              <button
                type="button"
                onClick={() => setIsNotifyOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {notifySent ? (
              <div className="py-6 text-center text-xs text-emerald-700 font-medium">
                ✓ {isEn ? 'Thank you! We will notify you as soon as this item is restocked.' : '¡Gracias! Te avisaremos por email en cuanto volvamos a tener stock.'}
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col gap-3">
                <p className="text-xs text-slate-600 leading-normal">
                  {isEn
                    ? `Leave your email to receive an alert when ${product.title} (${selectedOpt1}${selectedOpt2 ? ` / ${selectedOpt2.toUpperCase()}` : ''}) is back in stock.`
                    : `Introduce tu email para avisarte cuando ${product.title} (${selectedOpt1}${selectedOpt2 ? ` / ${selectedOpt2.toUpperCase()}` : ''}) vuelva a estar disponible.`
                  }
                </p>
                <input
                  type="email"
                  required
                  placeholder={isEn ? "Your email address" : "Tu correo electrónico"}
                  value={notifyContact}
                  onChange={(e) => setNotifyContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-none focus:outline-none focus:border-black font-sans"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-colors cursor-pointer"
                >
                  {isEn ? "NOTIFY ME" : "AVÍSAME"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
