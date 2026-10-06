import React, { useState, useEffect, useMemo } from 'react';
import { type Product, type ProductVariant } from '../types';
import { addToCart } from '../stores/cart';
import { getColorHex, isLightColor } from '../lib/utils';

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

  // 2. Group variant values into option groups (Option 1 = Color/Style, Option 2 = Size/Talla)
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
      // In clothing/fitness store, option 1 is always the variant Color/Style
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

  // 3. State for active options
  const [selectedOpt1, setSelectedOpt1] = useState<string>(
    optionGroups[0]?.values[0] || ''
  );
  const [selectedOpt2, setSelectedOpt2] = useState<string>(
    optionGroups[1]?.values[0] || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

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

    // Fallback: If option combination does not exist, find first variant matching selected Option 1
    if (!selectedVariant) {
      selectedVariant = product.variants.find((v) => {
        const parts = v.name.split('/').map((p) => p.trim());
        return parts[0] === selectedOpt1;
      }) || product.variants[0];
    }
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentSku = selectedVariant ? selectedVariant.sku : 'BASE';
  const isOutOfStock = currentStock <= 0;

  // 5. Update the main image in the Astro parent DOM when variant image changes
  useEffect(() => {
    if (selectedVariant?.image) {
      const imgEl = document.getElementById('main-product-image') as HTMLImageElement;
      if (imgEl) {
        imgEl.src = selectedVariant.image;
      }
    }
  }, [selectedVariant]);

  // Helper to check if a specific size is available for the currently selected color
  const isCombinationAvailable = (size: string): boolean => {
    if (optionGroups.length < 2) return true;
    const variant = product.variants.find((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      return parts[0] === selectedOpt1 && parts[1] === size;
    });
    return variant ? variant.stock > 0 : false;
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

  return (
    <div className="flex flex-col gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-premium">
      {/* Price */}
      <div className="flex justify-between items-baseline">
        <span className="text-4xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 font-mono">
          {(currentPrice / 100).toFixed(2)} €
        </span>
      </div>

      {/* Stock Status */}
      <div>
        {isOutOfStock ? (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
            {isEn ? 'Out of Stock' : 'Agotado'}
          </span>
        ) : (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {isEn ? `In Stock (${currentStock} available)` : `En Stock (${currentStock} disponibles)`}
          </span>
        )}
      </div>

      {/* Option Selectors */}
      {hasVariants && (
        <div className="flex flex-col gap-5 border-t border-slate-100 pt-5">
          {optionGroups.map((group, groupIdx) => {
            const isColorGroup = group.isColor;
            const currentValue = groupIdx === 0 ? selectedOpt1 : selectedOpt2;
            const setValue = groupIdx === 0 ? setSelectedOpt1 : setSelectedOpt2;

            return (
              <div key={group.name} className="flex flex-col gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>{group.name}:</span>
                  <span className="text-slate-900 font-bold tracking-normal normal-case capitalize">{currentValue}</span>
                </span>
                
                <div className="flex flex-wrap items-center gap-2.5 mt-1">
                  {group.values.map((value) => {
                    const isSelected = currentValue === value;
                    
                    if (isColorGroup) {
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
                          className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg relative cursor-pointer transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-0 ${
                            isSelected
                              ? 'border-2 border-slate-950 shadow-xs scale-105'
                              : isLight
                              ? 'border border-slate-300 hover:border-slate-500 hover:scale-105 shadow-3xs'
                              : 'border border-black/10 hover:border-black/30 hover:scale-105 shadow-3xs'
                          }`}
                          title={`${value} (${hex})`}
                          aria-label={`Color ${value}`}
                        >
                          {isSelected && (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              strokeWidth="3.5" 
                              stroke="currentColor" 
                              className={`w-3.5 h-3.5 drop-shadow-xs ${isLight ? 'text-slate-950' : 'text-white'}`}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    } else {
                      // Size / Text Box Selector (refined proportions)
                      const available = isCombinationAvailable(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setValue(value);
                            setQuantity(1);
                          }}
                          className={`h-8.5 min-w-[38px] px-3 py-1 text-xs font-bold font-mono tracking-wider uppercase rounded-xl border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                              : !available
                              ? 'opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {value}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quantity & Actions */}
      {!isOutOfStock && (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              {isEn ? 'Quantity:' : 'Cantidad:'}
            </span>
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors font-bold text-sm sm:text-base"
              >
                -
              </button>
              <span className="px-4 py-1.5 text-base sm:text-sm font-semibold text-slate-800 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors font-bold text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={quantity >= currentStock ? (isEn ? "Maximum stock reached" : "Máximo de stock alcanzado") : undefined}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-center tracking-widest uppercase text-sm sm:text-xs shadow-md transition-all duration-300 hover:shadow-lg ${
              addedFeedback
                ? 'bg-emerald-600 hover:bg-emerald-700 scale-98 shadow-inner'
                : 'bg-slate-950 hover:bg-rose-600 active:scale-98'
            }`}
          >
            {addedFeedback 
              ? (isEn ? 'Added to Cart! ✓' : '¡Añadido al Carrito! ✓') 
              : (isEn ? 'Add to Cart' : 'Añadir al Carrito')
            }
          </button>
        </div>
      )}
    </div>
  );
};
