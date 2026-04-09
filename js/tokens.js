/**
 * Token loader — fetches DTCG-format JSON for any library and
 * normalises it into flat maps the renderers can consume.
 *
 * Library folders use an en-dash in their names, so we encode
 * the path with encodeURI to keep fetch() happy.
 */

const LIBRARIES = {
  golden:      'Golden Ratio \u2013 Design Library by Hal',
  base10:      'Base 10 ratio \u2013 Design Library by Hal',
  typographic: 'Typographic ratio \u2013 Design Library by Hal',
};

const LIBRARY_LABELS = {
  golden:      'Golden Ratio',
  base10:      'Base 10 Ratio',
  typographic: 'Typographic Ratio',
};

const TOKEN_FILES = [
  'Colours.Light.tokens.json',
  'Colours.Dark.tokens.json',
  'Primatives.tokens.json',
  'Spacing.Positive.tokens.json',
  'Spacing.Negative.tokens.json',
  'Sizes.tokens.json',
  'Responsive.Desktop.tokens.json',
  'Responsive.Tablet.tokens.json',
  'Responsive.Mobile.tokens.json',
  'Effects.tokens.json',
];

/** Currently loaded raw JSON keyed by short file name (e.g. "Colours.Light") */
let cache = {};
let currentLibraryKey = 'golden';

export function getLibraries() { return LIBRARIES; }
export function getLibraryLabels() { return LIBRARY_LABELS; }
export function getCurrentLibraryKey() { return currentLibraryKey; }

/**
 * Load all 10 token files for the chosen library.
 * Returns an object keyed by short name, e.g.
 *   { "Colours.Light": { ... }, "Primatives": { ... }, ... }
 */
export async function loadLibrary(key) {
  currentLibraryKey = key;
  const folder = LIBRARIES[key];
  if (!folder) throw new Error(`Unknown library key: ${key}`);

  const entries = await Promise.all(
    TOKEN_FILES.map(async (file) => {
      const url = encodeURI(`${folder}/${file}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      const json = await res.json();
      const shortName = file.replace('.tokens.json', '');
      return [shortName, json];
    })
  );

  cache = Object.fromEntries(entries);
  return cache;
}

export function getCached() { return cache; }

/* -------------------------------------------------------
   Normalisation helpers — flatten DTCG into usable maps
   ------------------------------------------------------- */

/**
 * Recursively walk a JSON tree and collect leaf tokens (objects with $type).
 * Returns an array of { path: ["Color","Neutral","100"], ...tokenFields }.
 */
export function flattenTokens(obj, prefix = []) {
  const results = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$type' in val) {
      results.push({ path: [...prefix, key], ...val });
    } else if (val && typeof val === 'object') {
      results.push(...flattenTokens(val, [...prefix, key]));
    }
  }
  return results;
}

/**
 * Extract the hex value from a DTCG colour token.
 * Handles both `$value.hex` and raw string `$value`.
 */
export function colourHex(token) {
  if (!token || !token.$value) return null;
  if (typeof token.$value === 'string') return token.$value;
  if (token.$value.hex) return token.$value.hex;
  return null;
}

/**
 * Get the alias name from a token's $extensions, if present.
 */
export function aliasName(token) {
  const ad = token?.$extensions?.['com.figma.aliasData'];
  return ad?.targetVariableName ?? null;
}

/**
 * Group an array of flat tokens by their first path segment.
 * e.g. tokens with path ["Color","Neutral","100"] group under "Color".
 */
export function groupByFirst(tokens) {
  const groups = {};
  for (const t of tokens) {
    const key = t.path[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return groups;
}

/**
 * Group semantic colour tokens by their top-level role.
 * Colours are nested like Colour > Icon > Subtle, Colour > Font > Neutral > AA.
 * Returns { "Icon": [...], "Font": [...], "Neutral": [...], ... }
 */
export function groupSemanticColours(colourJson) {
  const colourGroup = colourJson?.Colour;
  if (!colourGroup) return {};

  const result = {};
  for (const [role, children] of Object.entries(colourGroup)) {
    if (role.startsWith('$')) continue;
    const flat = flattenTokens(children);
    result[role] = flat.map((t) => ({
      ...t,
      path: [role, ...t.path],
    }));
  }
  return result;
}

/**
 * Group primitive colours by ramp name (Neutral, Blue, etc.)
 * Returns { "Neutral": [...], "Blue": [...], ... }
 */
export function groupPrimitiveColours(primativesJson) {
  const colorGroup = primativesJson?.Color;
  if (!colorGroup) return {};

  const result = {};
  for (const [rampName, ramp] of Object.entries(colorGroup)) {
    if (rampName.startsWith('$')) continue;
    const flat = flattenTokens(ramp);
    result[rampName] = flat.map((t) => ({
      ...t,
      path: [rampName, ...t.path],
    }));
  }
  return result;
}

/**
 * Extract the Effects.Opacity colour tokens from a Colours.Light/Dark file.
 * These are under the key "Effects" > "Opacity" and have $type: "color".
 */
export function getEffectsOpacityColours(colourJson) {
  const effects = colourJson?.Effects?.Opacity;
  if (!effects) return [];
  return flattenTokens(effects).map((t) => ({
    ...t,
    path: ['Effects', 'Opacity', ...t.path],
  }));
}
