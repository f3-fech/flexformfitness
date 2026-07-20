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
 * Returns the hex color code for a given color name (Spanish or English)
 */
export function getColorHex(colorName: string): string {
  const name = colorName.toLowerCase().trim();
  const colorMap: Record<string, string> = {
    'negro': '#0f172a',
    'black': '#0f172a',
    'gris': '#94a3b8',
    'grey': '#94a3b8',
    'gray': '#94a3b8',
    'gris-oscuro': '#4b5563',
    'rosa': '#db2777',
    'pink': '#db2777',
    'amarillo': '#fbbf24',
    'yellow': '#fbbf24',
    'azul-metalizado': '#475569',
    'azul-marino': '#1e3a8a',
    'navy': '#1e3a8a',
    'azul-claro': '#a5f3fc',
    'blanco': '#ffffff',
    'white': '#ffffff',
    'rojo': '#dc2626',
    'red': '#dc2626',
    'verde': '#16a34a',
    'green': '#16a34a',
    'naranja': '#ea580c',
    'orange': '#ea580c',
  };

  for (const key in colorMap) {
    if (name.includes(key)) {
      return colorMap[key];
    }
  }
  return '#64748b';
}
