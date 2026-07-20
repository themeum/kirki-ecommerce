const CSS_VAR_PREFIX = '--kirki-ecommerce';

const primitive_colors = {
  blue1: 'hsl(187 100% 93%)',
  blue2: 'hsl(205 100% 40%)',
  blue3: 'hsl(220 100% 50%)',
  brand1: 'hsl(214 100% 54%)',
  brand2: 'hsl(214 83% 50%)',
  brand3: 'hsl(214 100% 85%)',
  brand4: 'hsl(214 100% 89%)',
  brand5: 'hsl(214 100% 95%)',
  gray1: 'hsl(0 0 100%)',
  gray2: 'hsl(255 30% 98%)',
  gray3: 'hsl(255 30% 98%)',
  gray4: 'hsl(250 26% 97%)',
  gray5: 'hsl(248 23% 96%)',
  gray6: 'hsl(248 20% 94%)',
  gray7: 'hsl(248 16% 93%)',
  gray8: 'hsl(252 14% 90%)',
  gray9: 'hsl(246 12% 84%)',
  gray10: 'hsl(250 13% 81%)',
  gray11: 'hsl(249 10% 72%)',
  gray12: 'hsl(249 6% 55%)',
  gray13: 'hsl(250 6% 39%)',
  gray14: 'hsl(252 6% 30%)',
  gray15: 'hsl(255 4% 20%)',
  gray16: 'hsl(270 4% 11%)',
  green1: 'hsl(141 100% 95%)',
  green3: 'hsl(145 36% 44%)',
  green4: 'hsl(145 47% 37%)',
  green5: 'hsl(134 61% 41%)',
  green6: 'hsl(134 61% 28%)',
  orange1: 'hsl(38 100% 92%)',
  orange2: 'hsl(42 100% 18%)',
  pink1: 'hsl(311 100% 65%)',
  pink2: 'hsl(311 100% 53%)',
  red1: 'hsl(2 100% 95%)',
  red2: 'hsl(0 70% 71%)',
  red3: 'hsl(0 100% 42%)',
  violet1: 'hsl(248 92% 95%)',
  violet2: 'hsl(266 100% 64%)',
  violet3: 'hsl(248 79% 96%)',
  yellow1: 'hsl(61 100% 89%)',
  yellow2: 'hsl(54 100% 15%)',
} as const;

type PrimitiveColorKey = keyof typeof primitive_colors;

const PRIMITIVE_CSS_VAR_KEYS: Record<PrimitiveColorKey, string> = {
  blue1: 'color-blue-1',
  blue2: 'color-blue-2',
  blue3: 'color-blue-3',
  brand1: 'color-brand-1',
  brand2: 'color-brand-2',
  brand3: 'color-brand-3',
  brand4: 'color-brand-4',
  brand5: 'color-brand-5',
  gray1: 'color-gray-1',
  gray2: 'color-gray-2',
  gray3: 'color-gray-3',
  gray4: 'color-gray-4',
  gray5: 'color-gray-5',
  gray6: 'color-gray-6',
  gray7: 'color-gray-7',
  gray8: 'color-gray-8',
  gray9: 'color-gray-9',
  gray10: 'color-gray-10',
  gray11: 'color-gray-11',
  gray12: 'color-gray-12',
  gray13: 'color-gray-13',
  gray14: 'color-gray-14',
  gray15: 'color-gray-15',
  gray16: 'color-gray-16',
  green1: 'color-green-1',
  green3: 'color-green-3',
  green4: 'color-green-4',
  green5: 'color-green-5',
  green6: 'color-green-6',
  orange1: 'color-orange-1',
  orange2: 'color-orange-2',
  pink1: 'color-pink-1',
  pink2: 'color-pink-2',
  red1: 'color-red-1',
  red2: 'color-red-2',
  red3: 'color-red-3',
  violet1: 'color-violet-1',
  violet2: 'color-violet-2',
  violet3: 'color-violet-3',
  yellow1: 'color-yellow-1',
  yellow2: 'color-yellow-2',
};

/**
 * Build a CSS custom property name for a primitive color key.
 *
 * @param key Primitive color key from the theme.
 *
 * @returns CSS variable name with the kirki-ecommerce prefix.
 */
const get_css_var_name = (key: PrimitiveColorKey): string => {
  return `${CSS_VAR_PREFIX}-${PRIMITIVE_CSS_VAR_KEYS[key]}`;
};

/**
 * Reference a primitive color as a CSS var() expression.
 *
 * @param key Primitive color key from the theme.
 *
 * @returns CSS var() string pointing at the matching custom property.
 */
const css_var = (key: PrimitiveColorKey): string => {
  return `var(${get_css_var_name(key)})`;
};

const theme = {
  primitives: {
    colors: primitive_colors,
  },
  colors: {
    background: {
      fill: css_var('gray1'),
      fillBrand: css_var('brand1'),
      fillBrandHover: css_var('brand2'),
      fillCaution: css_var('yellow2'),
      fillCautionSecondary: css_var('yellow1'),
      fillCritical: css_var('red3'),
      fillCriticalSecondary: css_var('red1'),
      fillDisabled: css_var('gray12'),
      fillHover: css_var('gray6'),
      fillSecondary: css_var('brand5'),
      fillSecondaryHover: css_var('brand4'),
      fillSpecial: css_var('blue2'),
      fillSpecial2: css_var('violet2'),
      fillSpecial2Secondary: css_var('violet1'),
      fillSpecial3Tertiary: css_var('violet3'),
      fillSpecialSecondary: css_var('blue1'),
      fillSuccess: css_var('green6'),
      fillSuccessSecondary: css_var('green1'),
      fillTertiary: css_var('gray9'),
      fillTertiaryHover: css_var('gray11'),
      fillWarning: css_var('orange2'),
      fillWarningSecondary: css_var('orange1'),
      inverse: css_var('gray16'),
      surface: css_var('gray1'),
      surfaceAlt: css_var('gray2'),
      surfaceDisabled: css_var('gray9'),
      surfaceSecondary: css_var('gray4'),
      surfaceSubdued: css_var('gray7'),
      surfaceTertiary: css_var('gray5'),
    },
    border: {
      default: css_var('gray8'),
      critical: css_var('red2'),
      disabled: css_var('gray10'),
      hover: css_var('gray12'),
      inverse: css_var('gray16'),
      ring: css_var('gray14'),
      secondary: css_var('gray6'),
      tertiary: css_var('gray5'),
    },
    icon: {
      brand: css_var('green4'),
      caution: css_var('yellow2'),
      critical: css_var('red3'),
      disabled: css_var('gray11'),
      emphasis: css_var('blue3'),
      inverse: css_var('gray5'),
      primary: css_var('gray14'),
      primaryActive: css_var('gray16'),
      primaryHover: css_var('gray15'),
      secondary: css_var('gray12'),
      secondaryActive: css_var('gray14'),
      secondaryHover: css_var('gray13'),
      special: css_var('pink2'),
      success: css_var('green5'),
      warning: css_var('orange2'),
    },
    text: {
      brand: css_var('green4'),
      caution: css_var('yellow2'),
      critical: css_var('red3'),
      disabled: css_var('gray11'),
      emphasis: css_var('blue3'),
      light: css_var('gray1'),
      primary: css_var('gray15'),
      secondary: css_var('gray13'),
      special: css_var('pink2'),
      special2: css_var('blue2'),
      special3: css_var('violet2'),
      subdued: css_var('gray12'),
      success: css_var('green6'),
      warning: css_var('orange2'),
    },
  },
  spacing: {
    none: '0',
    xxs: '0.125rem',
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    base: '0.625rem',
    lg: '0.75rem',
    xl: '0.875rem',
    '2xl': '1rem',
    '3xl': '1.25rem',
    '4xl': '1.5rem',
    '5xl': '1.75rem',
    '6xl': '2rem',
    '7xl': '2.25rem',
    '8xl': '2.5rem',
    '9xl': '2.75rem',
    '10xl': '3rem',
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
} as const;

type AppTheme = typeof theme;

export type { AppTheme, PrimitiveColorKey };
export { theme, get_css_var_name, CSS_VAR_PREFIX, PRIMITIVE_CSS_VAR_KEYS };
