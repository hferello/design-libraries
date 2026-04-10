/**
 * CSS variable name mappings mirroring the Number System npm package
 * (@hferello/number-system-npm)
 * Style Dictionary pipeline. Produces the same --var names the package exports.
 */

const SPACING_NAME_MAP = {
  'Flush': 'flush',
  'Tightly related, one unit': 'tight',
  'Clearly paired, slight breath': 'paired',
  'Same group, distinct items': 'grouped',
  'Loose group, breathing room': 'loose',
  'Distinct sections, clear gap': 'section',
  'Independent, different context': 'independent',
  'New section': 'region',
  'Clear visual break between zones': 'zone',
  'Unrelated, structural separation': 'divide',
  'Very far apart': 'apart',
};

const FONT_SIZE_NAME_MAP = {
  'XSmall': 'xs',
  'Small': 'sm',
  'Regular': 'base',
  'Medium': 'md',
  'Large': 'lg',
  'XLarge': 'xl',
  'XXLarge': '2xl',
};

const RADIUS_NAME_MAP = {
  'Sharp': 'sharp',
  'Subtle': 'subtle',
  'Soft': 'soft',
  'Rounded': 'rounded',
  'Pill': 'pill',
  'Circular': 'circular',
};

const BORDER_WEIGHT_NAME_MAP = {
  'Hairline': 'hairline',
  'Defined': 'defined',
  'Bold': 'bold',
  'Graphic': 'graphic',
};

const BLUR_NAME_MAP = {
  'Soft': 'soft',
  'Hazy': 'hazy',
  'Foggy': 'foggy',
  'Void': 'void',
};

const OPACITY_NAME_MAP = {
  'Full': 'full',
  'High': 'high',
  'Medium': 'medium',
  'Low': 'low',
  'Faint': 'faint',
};

const GRID_NAME_MAP = {
  'Horizontal': '--grid-columns',
  'Margin': '--spacing-grid-margin',
  'Gutter': '--spacing-grid-gutter',
};

const GRID_VERTICAL_NAME_MAP = {
  'Tight': '--spacing-grid-vertical-tight',
  'Default': '--spacing-grid-vertical-default',
  'Loose': '--spacing-grid-vertical-loose',
};

export function spacingCssVar(figma_name) {
  const mapped = SPACING_NAME_MAP[figma_name];
  return mapped ? `--spacing-${mapped}` : null;
}

export function fontSizeCssVar(figma_name) {
  const mapped = FONT_SIZE_NAME_MAP[figma_name];
  return mapped ? `--text-${mapped}` : null;
}

export function radiusCssVar(figma_name) {
  const mapped = RADIUS_NAME_MAP[figma_name];
  return mapped ? `--radius-${mapped}` : null;
}

export function borderWeightCssVar(figma_name) {
  const mapped = BORDER_WEIGHT_NAME_MAP[figma_name];
  return mapped ? `--border-${mapped}` : null;
}

export function blurCssVar(figma_name) {
  const mapped = BLUR_NAME_MAP[figma_name];
  return mapped ? `--blur-${mapped}` : null;
}

export function opacityCssVar(figma_name) {
  const mapped = OPACITY_NAME_MAP[figma_name];
  return mapped ? `--opacity-${mapped}` : null;
}

export function gridCssVar(setting_name) {
  return GRID_NAME_MAP[setting_name] ?? null;
}

export function gridVerticalCssVar(setting_name) {
  return GRID_VERTICAL_NAME_MAP[setting_name] ?? null;
}

/**
 * Derive the CSS variable name for a semantic colour token.
 * Path array comes from our flattenTokens, e.g. ["Icon", "Subtle"] or ["Font", "Neutral", "AA"].
 */
export function semanticColourCssVar(path) {
  if (path.length === 0) return null;

  const role = path[0];

  if (role === 'Icon') {
    const name = (path[1] ?? '').toLowerCase().replace(/\s+/g, '-');
    return `--color-icon-${name}`;
  }

  if (role === 'Font') {
    if (path[1] === 'Neutral') {
      const level = (path[2] ?? '').toLowerCase().replace(/\s+/g, '-');
      return `--color-fg-neutral-${level}`;
    }
    const hue = (path[1] ?? '').toLowerCase();
    const level = (path[2] ?? '').toLowerCase().replace(/\s+/g, '-');
    return `--color-fg-${hue}-${level}`;
  }

  if (role === 'Neutral') {
    const level = (path[1] ?? '').toLowerCase().replace(/\s+/g, '-');
    return `--color-neutral-${level}`;
  }

  // Hue colours: Blue, Green, Orange, Purple, Red
  const hue = role.toLowerCase();
  const level = (path[1] ?? '').toLowerCase().replace(/\s+/g, '-');
  return `--color-${hue}-${level}`;
}

/**
 * Derive the CSS variable name for a primitive colour token.
 * Path array e.g. ["Neutral", "100"] or ["Blue", "500"].
 */
export function primitiveColourCssVar(path) {
  const segments = path.map(s => {
    if (s === 'Tranparent blacks') return 'transparent-black';
    if (s === 'Tranparent whites') return 'transparent-white';
    return s.toLowerCase().replace(/\s+/g, '-');
  });
  return `--primitive-color-${segments.join('-')}`;
}
