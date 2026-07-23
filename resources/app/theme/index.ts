const CSS_VAR_PREFIX = '--kirki-ecommerce';

const primitiveColors = {
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
  neutralSurface: '#e9e9e9',
  badgeDraft: '#09090B99',
  buttonTertiary: '#F5F5F5',
  optionHover: '#f4f4f5',
  textMuted: '#71717a',
  textDark: '#333333',
  settingsHover: '#DEDAF4',
  placeholderSurface: '#f7f7f7',
  borderAlt: '#e6e6e6',
  galleryBorder: '#E4E4E7',
  borderMuted: '#d2d4d8',
  galleryHover: '#f7f4ff',
  shippingBoxLight: '#ceaaff',
  shippingBoxMid: '#bf84e9',
  shippingBoxDark: '#9663b6',
} as const;

type PrimitiveColorKey = keyof typeof primitiveColors;

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
  neutralSurface: 'color-neutral-surface',
  badgeDraft: 'color-badge-draft',
  buttonTertiary: 'color-button-tertiary',
  optionHover: 'color-option-hover',
  textMuted: 'color-text-muted',
  textDark: 'color-text-dark',
  settingsHover: 'color-settings-hover',
  placeholderSurface: 'color-placeholder-surface',
  borderAlt: 'color-border-alt',
  galleryBorder: 'color-gallery-border',
  borderMuted: 'color-border-muted',
  galleryHover: 'color-gallery-hover',
  shippingBoxLight: 'color-shipping-box-light',
  shippingBoxMid: 'color-shipping-box-mid',
  shippingBoxDark: 'color-shipping-box-dark',
};

/**
 * Build a CSS custom property name for a primitive color key.
 *
 * @param key Primitive color key from the theme.
 *
 * @returns CSS variable name with the kirki-ecommerce prefix.
 */
const getCssVarName = (key: PrimitiveColorKey): string => {
  return `${CSS_VAR_PREFIX}-${PRIMITIVE_CSS_VAR_KEYS[key]}`;
};

/**
 * Reference a primitive color as a CSS var() expression.
 *
 * @param key Primitive color key from the theme.
 *
 * @returns CSS var() string pointing at the matching custom property.
 */
const cssVar = (key: PrimitiveColorKey): string => {
  return `var(${getCssVarName(key)})`;
};

const theme = {
  primitives: {
    colors: primitiveColors,
  },
  colors: {
    background: {
      fill: cssVar('gray1'),
      fillBrand: cssVar('brand1'),
      fillBrandHover: cssVar('brand2'),
      fillCaution: cssVar('yellow2'),
      fillCautionSecondary: cssVar('yellow1'),
      fillCritical: cssVar('red3'),
      fillCriticalSecondary: cssVar('red1'),
      fillDisabled: cssVar('gray12'),
      fillHover: cssVar('gray6'),
      fillSecondary: cssVar('brand5'),
      fillSecondaryHover: cssVar('brand4'),
      fillSpecial: cssVar('blue2'),
      fillSpecial2: cssVar('violet2'),
      fillSpecial2Secondary: cssVar('violet1'),
      fillSpecial3Tertiary: cssVar('violet3'),
      fillSpecialSecondary: cssVar('blue1'),
      fillSuccess: cssVar('green6'),
      fillSuccessSecondary: cssVar('green1'),
      fillTertiary: cssVar('gray9'),
      fillTertiaryHover: cssVar('gray11'),
      fillWarning: cssVar('orange2'),
      fillWarningSecondary: cssVar('orange1'),
      inverse: cssVar('gray16'),
      surface: cssVar('gray1'),
      surfaceAlt: cssVar('gray2'),
      surfaceDisabled: cssVar('gray9'),
      surfaceSecondary: cssVar('gray4'),
      surfaceSubdued: cssVar('gray7'),
      surfaceTertiary: cssVar('gray5'),
      buttonTertiary: cssVar('buttonTertiary'),
      settingsHover: cssVar('settingsHover'),
      placeholderSurface: cssVar('placeholderSurface'),
      galleryHover: cssVar('galleryHover'),
      optionHover: cssVar('optionHover'),
      neutralSurface: cssVar('neutralSurface'),
      badgeDraft: cssVar('badgeDraft'),
    },
    border: {
      default: cssVar('gray8'),
      critical: cssVar('red2'),
      disabled: cssVar('gray10'),
      hover: cssVar('gray12'),
      inverse: cssVar('gray16'),
      ring: cssVar('gray14'),
      secondary: cssVar('gray6'),
      tertiary: cssVar('gray5'),
      alt: cssVar('borderAlt'),
      gallery: cssVar('galleryBorder'),
      muted: cssVar('borderMuted'),
    },
    icon: {
      brand: cssVar('green4'),
      caution: cssVar('yellow2'),
      critical: cssVar('red3'),
      disabled: cssVar('gray11'),
      emphasis: cssVar('blue3'),
      inverse: cssVar('gray5'),
      primary: cssVar('gray14'),
      primaryActive: cssVar('gray16'),
      primaryHover: cssVar('gray15'),
      secondary: cssVar('gray12'),
      secondaryActive: cssVar('gray14'),
      secondaryHover: cssVar('gray13'),
      special: cssVar('pink2'),
      success: cssVar('green5'),
      warning: cssVar('orange2'),
    },
    text: {
      brand: cssVar('green4'),
      caution: cssVar('yellow2'),
      critical: cssVar('red3'),
      disabled: cssVar('gray11'),
      emphasis: cssVar('blue3'),
      light: cssVar('gray1'),
      primary: cssVar('gray15'),
      secondary: cssVar('gray13'),
      special: cssVar('pink2'),
      special2: cssVar('blue2'),
      special3: cssVar('violet2'),
      subdued: cssVar('gray12'),
      success: cssVar('green6'),
      warning: cssVar('orange2'),
      muted: cssVar('textMuted'),
      dark: cssVar('textDark'),
    },
    shipping: {
      boxLight: cssVar('shippingBoxLight'),
      boxMid: cssVar('shippingBoxMid'),
      boxDark: cssVar('shippingBoxDark'),
    },
  },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
    },
    lineHeight: {
      base: '21px',
      tight: '18px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    none: '0', // 0px
    xxs: '0.125rem', // 2px
    xs: '0.25rem', // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    base: '0.625rem', // 10px
    lg: '0.75rem', // 12px
    xl: '0.875rem', // 14px
    '2xl': '1rem', // 16px
    '3xl': '1.25rem', // 20px
    '4xl': '1.5rem', // 24px
    '5xl': '1.75rem', // 28px
    '6xl': '2rem', // 32px
    '7xl': '2.25rem', // 36px
    '8xl': '2.5rem', // 40px
    '9xl': '2.75rem', // 44px
    '10xl': '3rem', // 48px
  },
  radius: {
    none: '0', // 0px
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    full: '9999px',
  },
} as const;

type AppTheme = typeof theme;

export { CSS_VAR_PREFIX, getCssVarName, PRIMITIVE_CSS_VAR_KEYS, theme };
export type { AppTheme, PrimitiveColorKey };

