export interface ParsedColor { hex: number; alpha: number; cssHex: string; }

/** Parses engine color strings: "(r,g,b,a)" or "#rrggbb" */
export function parseColor(colorStr: string | undefined): ParsedColor {
  if (!colorStr) return { hex: 0xffffff, alpha: 1, cssHex: '#ffffff' };

  const rgba = colorStr.match(/\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgba) {
    const r = parseInt(rgba[1]);
    const g = parseInt(rgba[2]);
    const b = parseInt(rgba[3]);
    const a = parseFloat(rgba[4]);
    const hex = (r << 16) | (g << 8) | b;
    return { hex, alpha: a, cssHex: `#${hex.toString(16).padStart(6, '0')}` };
  }

  const clean = colorStr.replace('#', '');
  const hex = parseInt(clean, 16) || 0xffffff;
  return { hex, alpha: 1, cssHex: `#${hex.toString(16).padStart(6, '0')}` };
}

/** Converts a PixiJS hex number to CSS string */
export function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Converts r,g,b (0-255) and alpha to engine "(r,g,b,a)" string */
export function toEngineColor(cssHex: string, alpha: number): string {
  const hex = parseInt(cssHex.replace('#', ''), 16);
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `(${r},${g},${b},${alpha})`;
}
