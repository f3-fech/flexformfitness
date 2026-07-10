import React, { useState, useEffect } from 'react';
import { type Product, type ProductVariant } from '../types';
import { addToCart } from '../stores/cart';

interface ProductSelectorProps {
  product: Product;
  lang?: string;
}

// Map color names to exact hex values
const getColorHex = (colorName: string): string => {
  const name = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    'negro': '#0f172a',        // Slate 900
    'black': '#0f172a',
    'gris': '#94a3b8',         // Slate 400
    'grey': '#94a3b8',
    'gray': '#94a3b8',
    'gris-oscuro': '#4b5563',  // Gray 600
    'rosa': '#db2777',         // Pink 600
    'pink': '#db2777',
    'amarillo': '#fbbf24',     // Amber 400
    'yellow': '#fbbf24',
    'azul-metalizado': '#475569', // Slate 600
    'azul-marino': '#1e3a8a',  // Blue 900
    'navy': '#1e3a8a',
    'azul-claro': '#a5f3fc',   // Cyan 200
    'blanco': '#ffffff',       // White
    'white': '#ffffff',
    'rojo': '#dc2626',         // Red 600
    'red': '#dc2626',
    'verde': '#16a34a',        // Green 600
    'green': '#16a34a',
    'naranja': '#ea580c',      // Orange 600
    'orange': '#ea580c',
  };

  for (const key in colorMap) {
    if (name.includes(key)) {
      return colorMap[key];
    }
  }
  return '#64748b'; // Fallback gray
};

export const ProductSelector: React.FC<ProductSelectorProps> = ({ product, lang = 'es' }) => {
  const hasVariants = product.variants && product.variants.length > 0;
  const isEn = lang === 'en';

  // 1. Group variant values into option groups (Option 1 = Color/Style, Option 2 = Size/Talla)
  const optionGroups: { name: string; values: string[] }[] = [];
  
  if (hasVariants) {
    const opt1Values = new Set<string>();
    const opt2Values = new Set<string>();
    
    product.variants.forEach((v) => {
      const parts = v.name.split('/').map((p) => p.trim());
      if (parts[0]) opt1Values.add(parts[0]);
      if (parts[1]) opt2Values.add(parts[1]);
    });
    
    if (opt1Values.size > 0) {
      const isColor = Array.from(opt1Values).some((val) => 
        ['negro', 'black', 'gris', 'grey', 'gray', 'rosa', 'pink', 'amarillo', 'yellow', 'azul', 'blue', 'blanco', 'white', 'verde', 'green', 'rojo', 'red', 'naranja', 'orange', 'metalizado', 'marino', 'claro', 'oscuro'].some((c) => val.toLowerCase().includes(c))
      );
      optionGroups.push({
        name: isColor ? (isEn ? 'Color' : 'Color') : (isEn ? 'Option' : 'Opción'),
        values: Array.from(opt1Values),
      });
    }
    
    if (opt2Values.size > 0) {
      optionGroups.push({
        name: isEn ? 'Size' : 'Talla',
        values: Array.from(opt2Values),
      });
    }
  }

  // 2. State for active options
  const [selectedOpt1, setSelectedOpt1] = useState<string>(
    optionGroups[0]?.values[0] || ''
  );
  const [selectedOpt2, setSelectedOpt2] = useState<string>(
    optionGroups[1]?.values[0] || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  // 3. Find matching variant based on current selectors
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

  // 4. Update the main image in the Astro parent DOM when variant image changes
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
    });

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-premium">
      {/* Price & SKU */}
      <div className="flex justify-between items-baseline">
        <span className="text-3xl font-extrabold text-slate-950 font-mono">
          ${(currentPrice / 100).toFixed(2)}
        </span>
        <span className="text-xs text-slate-400 font-mono">SKU: {currentSku}</span>
      </div>

      {/* Stock Status */}
      <div>
        {isOutOfStock ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
            {isEn ? 'Out of Stock' : 'Agotado'}
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            {isEn ? `In Stock (${currentStock} available)` : `En Stock (${currentStock} disponibles)`}
          </span>
        )}
      </div>

      {/* Option Selectors */}
      {hasVariants && (
        <div className="flex flex-col gap-5 border-t border-slate-100 pt-5">
          {optionGroups.map((group, groupIdx) => {
            const isColorGroup = group.name.toLowerCase() === 'color';
            const currentValue = groupIdx === 0 ? selectedOpt1 : selectedOpt2;
            const setValue = groupIdx === 0 ? setSelectedOpt1 : setSelectedOpt2;

            return (
              <div key={group.name} className="flex flex-col gap-2.5">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  {group.name}: <span className="text-slate-900 font-bold tracking-normal normal-case">{currentValue}</span>
                </span>
                
                <div className="flex flex-wrap gap-2.5">
                  {group.values.map((value) => {
                    const isSelected = currentValue === value;
                    
                    if (isColorGroup) {
                      const hex = getColorHex(value);
                      const isWhite = hex === '#ffffff';
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setValue(value);
                            setQuantity(1);
                          }}
                          style={{ backgroundColor: hex }}
                          className={`w-9 h-9 rounded-full relative cursor-pointer border-2 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${
                            isSelected
                              ? 'border-rose-600 ring-2 ring-red-200 ring-offset-2 ring-offset-white'
                              : 'border-slate-200/80'
                          }`}
                          title={value}
                        >
                          {isSelected && (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              strokeWidth="3" 
                              stroke="currentColor" 
                              className={`w-4 h-4 ${isWhite ? 'text-slate-900' : 'text-white'}`}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      );
                    } else {
                      // Size / Text Box Selector
                      const available = isCombinationAvailable(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setValue(value);
                            setQuantity(1);
                          }}
                          className={`px-4 py-2 text-xs font-extrabold font-mono tracking-wider uppercase rounded-xl border transition-all duration-200 ${
                            isSelected
                              ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                              : !available
                              ? 'opacity-40 bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
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
                className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-l-xl transition-colors font-bold"
              >
                -
              </button>
              <span className="px-4 py-1 text-sm font-semibold text-slate-800 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-r-xl transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-center tracking-widest uppercase text-xs shadow-md transition-all duration-300 hover:shadow-lg ${
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
