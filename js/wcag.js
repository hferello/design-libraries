/**
 * WCAG contrast-ratio utilities.
 * Implements the W3C relative-luminance formula and AA / AAA thresholds.
 */

/**
 * Convert a single sRGB channel (0-255) to its linear-light value.
 */
function linearise(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Relative luminance of an [r, g, b] colour (each 0-255).
 */
export function luminance(r, g, b) {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Contrast ratio between two luminance values.
 * Returns a number >= 1.
 */
export function contrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse a hex string like "#FF8000" into [r, g, b].
 */
export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/**
 * Return WCAG level string for a given contrast ratio.
 *  >= 7   → "AAA"
 *  >= 4.5 → "AA"
 *  >= 3   → "AA Large"
 *  else   → "Fail"
 */
export function wcagLevel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/**
 * Determine whether text on a colour is light or dark, so we can
 * pick an appropriate foreground for swatch labels.
 */
export function textColourOnBg(hex) {
  const [r, g, b] = hexToRgb(hex);
  const lum = luminance(r, g, b);
  return lum > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Build contrast info for a colour against white (#FFF) and black (#000).
 * Returns { onWhite: { ratio, level }, onBlack: { ratio, level } }
 */
export function contrastInfo(hex) {
  const [r, g, b] = hexToRgb(hex);
  const lum = luminance(r, g, b);
  const whiteLum = 1;
  const blackLum = 0;

  const onWhiteRatio = contrastRatio(lum, whiteLum);
  const onBlackRatio = contrastRatio(lum, blackLum);

  return {
    onWhite: { ratio: onWhiteRatio, level: wcagLevel(onWhiteRatio) },
    onBlack: { ratio: onBlackRatio, level: wcagLevel(onBlackRatio) },
  };
}
