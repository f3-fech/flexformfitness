/**
 * Extracts the object position parameter from a URL hash (e.g. #pos=top -> 'top')
 */
export function getObjectPosition(url: string | undefined): string {
  if (!url) return 'center';
  const match = url.match(/#pos=([a-zA-Z0-9%_-]+)/);
  if (match && match[1]) {
    return match[1].replace('_', ' ');
  }
  return 'center';
}

/**
 * Validates whether a given string is a valid 3, 4, 6 or 8 digit HEX color code
 */
export function isValidHex(hex: string): boolean {
  if (!hex) return false;
  const clean = hex.trim().replace(/^#/, '');
  return /^[0-9a-fA-F]{3,8}$/.test(clean);
}

/**
 * Ensures a HEX color code starts with '#' and is formatted properly
 */
export function formatHex(hex: string, defaultFallback = '#0f172a'): string {
  if (!hex) return defaultFallback;
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3,8}$/.test(clean)) {
    return `#${clean.toLowerCase()}`;
  }
  return defaultFallback;
}

/**
 * Determines whether a given HEX color is light or dark based on perceived luminance.
 * Useful for adjusting contrast, borders, and checkmark colors on swatches.
 */
export function isLightColor(hex: string): boolean {
  if (!hex) return false;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length < 6) return false;

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;

  // HSP / Perceived brightness formula
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 185; // Light color threshold
}

/**
 * Curated list of popular modern fitness & lifestyle apparel colors for quick presets
 */
export const presetFitnessColors: Array<{ name: string; hex: string }> = [
  { name: 'Negro Onix', hex: '#0f172a' },
  { name: 'Blanco Puro', hex: '#ffffff' },
  { name: 'Gris Jaspeado', hex: '#94a3b8' },
  { name: 'Gris Antracita', hex: '#334155' },
  { name: 'Azul Marino', hex: '#1e3a8a' },
  { name: 'Azul Eléctrico', hex: '#2563eb' },
  { name: 'Azul Celeste', hex: '#38bdf8' },
  { name: 'Azul Petróleo', hex: '#0e7490' },
  { name: 'Verde Salvia', hex: '#84a98c' },
  { name: 'Verde Menta', hex: '#6ee7b7' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Verde Oliva / Caqui', hex: '#556b2f' },
  { name: 'Verde Bosque', hex: '#166534' },
  { name: 'Burdeos / Vino', hex: '#881337' },
  { name: 'Rojo Carmesí', hex: '#dc2626' },
  { name: 'Coral Suave', hex: '#fb7185' },
  { name: 'Rosa Palo', hex: '#f472b6' },
  { name: 'Fucsia Neón', hex: '#db2777' },
  { name: 'Terracota / Teja', hex: '#c2410c' },
  { name: 'Mostaza / Ocre', hex: '#d97706' },
  { name: 'Arena / Beige', hex: '#d4c5b9' },
  { name: 'Marfil / Crema', hex: '#fef3c7' },
  { name: 'Lavanda / Lila', hex: '#c084fc' },
  { name: 'Marrón Chocolate', hex: '#451a03' },
];

/**
 * Comprehensive color dictionary for sports, fitness and casual apparel
 */
const colorDictionary: Record<string, string> = {
  // Monochromes & Grays
  'negro': '#0f172a',
  'black': '#0f172a',
  'onix': '#0f172a',
  'onyx': '#0f172a',
  'azabache': '#09090b',
  'blanco': '#ffffff',
  'white': '#ffffff',
  'pure white': '#ffffff',
  'gris': '#94a3b8',
  'grey': '#94a3b8',
  'gray': '#94a3b8',
  'gris claro': '#cbd5e1',
  'light grey': '#cbd5e1',
  'light gray': '#cbd5e1',
  'gris oscuro': '#475569',
  'dark grey': '#475569',
  'dark gray': '#475569',
  'antracita': '#334155',
  'anthracite': '#334155',
  'carbon': '#1e293b',
  'carbón': '#1e293b',
  'charcoal': '#1e293b',
  'grafito': '#374151',
  'graphite': '#374151',
  'humo': '#64748b',
  'smoke': '#64748b',
  'plata': '#e2e8f0',
  'silver': '#e2e8f0',

  // Blues & Cyans
  'azul': '#2563eb',
  'blue': '#2563eb',
  'azul marino': '#1e3a8a',
  'marino': '#1e3a8a',
  'navy': '#1e3a8a',
  'navy blue': '#1e3a8a',
  'azul noche': '#172554',
  'midnight blue': '#172554',
  'azul electrico': '#2563eb',
  'azul eléctrico': '#2563eb',
  'electric blue': '#2563eb',
  'azul real': '#1d4ed8',
  'royal blue': '#1d4ed8',
  'azul metalizado': '#475569',
  'azul claro': '#7dd3fc',
  'light blue': '#7dd3fc',
  'celeste': '#38bdf8',
  'sky blue': '#38bdf8',
  'cian': '#06b6d4',
  'cyan': '#06b6d4',
  'turquesa': '#14b8a6',
  'turquoise': '#14b8a6',
  'petroleo': '#0e7490',
  'petróleo': '#0e7490',
  'teal': '#0f766e',
  'indigo': '#4f46e5',
  'índigo': '#4f46e5',

  // Greens
  'verde': '#16a34a',
  'green': '#16a34a',
  'verde menta': '#6ee7b7',
  'menta': '#6ee7b7',
  'mint': '#6ee7b7',
  'mint green': '#6ee7b7',
  'verde salvia': '#84a98c',
  'salvia': '#84a98c',
  'sage': '#84a98c',
  'sage green': '#84a98c',
  'verde oliva': '#556b2f',
  'oliva': '#556b2f',
  'olive': '#556b2f',
  'olive green': '#556b2f',
  'caqui': '#78716c',
  'khaki': '#78716c',
  'militar': '#4d5d53',
  'military green': '#4d5d53',
  'verde esmeralda': '#059669',
  'esmeralda': '#059669',
  'emerald': '#059669',
  'verde bosque': '#166534',
  'bosque': '#166534',
  'forest green': '#166534',
  'verde lima': '#84cc16',
  'lima': '#84cc16',
  'lime': '#84cc16',
  'pistacho': '#a3e635',

  // Pinks, Reds & Purples
  'rosa': '#f472b6',
  'pink': '#f472b6',
  'rosa palo': '#f472b6',
  'dusty rose': '#f472b6',
  'rosa chicle': '#ec4899',
  'bubblegum': '#ec4899',
  'fucsia': '#db2777',
  'fuchsia': '#db2777',
  'magenta': '#d946ef',
  'coral': '#fb7185',
  'salmon': '#fda4af',
  'salmón': '#fda4af',
  'peach': '#fed7aa',
  'melocoton': '#fed7aa',
  'melocotón': '#fed7aa',
  'rojo': '#dc2626',
  'red': '#dc2626',
  'rojo carmesi': '#dc2626',
  'crimson': '#dc2626',
  'rojo escarlata': '#e11d48',
  'scarlet': '#e11d48',
  'burdeos': '#881337',
  'burgundy': '#881337',
  'bordeaux': '#881337',
  'granate': '#831843',
  'maroon': '#831843',
  'vino': '#4c0519',
  'wine': '#4c0519',
  'cereza': '#9f1239',
  'cherry': '#9f1239',
  'morado': '#7e22ce',
  'purple': '#7e22ce',
  'violeta': '#8b5cf6',
  'violet': '#8b5cf6',
  'purpura': '#9333ea',
  'púrpura': '#9333ea',
  'lavanda': '#c084fc',
  'lavender': '#c084fc',
  'lila': '#d8b4fe',
  'lilac': '#d8b4fe',
  'malva': '#c4b5fd',
  'mauve': '#c4b5fd',

  // Oranges & Yellows
  'naranja': '#ea580c',
  'orange': '#ea580c',
  'naranja neon': '#f97316',
  'terracota': '#c2410c',
  'terracotta': '#c2410c',
  'teja': '#b45309',
  'caldera': '#9a3412',
  'amarillo': '#fbbf24',
  'yellow': '#fbbf24',
  'mostaza': '#d97706',
  'mustard': '#d97706',
  'ocre': '#b45309',
  'oro': '#eab308',
  'dorado': '#eab308',
  'gold': '#eab308',
  'bronce': '#92400e',
  'bronze': '#92400e',
  'cobre': '#b45309',
  'copper': '#b45309',

  // Earth Tones & Neutrals
  'beige': '#d4c5b9',
  'arena': '#e7d8c9',
  'sand': '#e7d8c9',
  'camel': '#b4845a',
  'marfil': '#fef3c7',
  'ivory': '#fef3c7',
  'crema': '#fef3c7',
  'cream': '#fef3c7',
  'topo': '#78716c',
  'taupe': '#78716c',
  'marron': '#78350f',
  'marrón': '#78350f',
  'brown': '#78350f',
  'chocolate': '#451a03',
  'cafe': '#582f0e',
  'café': '#582f0e',
  'coffee': '#582f0e',
  'caramelo': '#a16207',
  'caramel': '#a16207',
};

/**
 * Returns the hex color code for a given color name, hex code or description
 */
export function getColorHex(colorName: string, fallback = '#64748b'): string {
  if (!colorName) return fallback;
  const raw = colorName.trim();

  // 1. If it's already a valid HEX code, return formatted
  if (raw.startsWith('#') || /^[0-9a-fA-F]{6}$/.test(raw) || /^[0-9a-fA-F]{3}$/.test(raw)) {
    return formatHex(raw, fallback);
  }

  const name = raw.toLowerCase();

  // 2. Exact match in dictionary
  if (colorDictionary[name]) {
    return colorDictionary[name];
  }

  // 3. Substring / multi-word search (longest matches first)
  const sortedKeys = Object.keys(colorDictionary).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return colorDictionary[key];
    }
  }

  return fallback;
}

