const CSS_VAR_PREFIX = '--kirki-ecommerce';

const primitiveColors = {
  blue1: 'rgba(8, 227, 255, 0.24)',
  blue2: 'rgba(0, 120, 206, 1.0)',
  blue3: 'rgba(0, 85, 255, 1.0)',
  brand1: '#167BFF',
  brand2: '#1670E7',
  brand3: 'rgba(22, 123, 255, 0.12)',
  brand4: 'rgba(22, 123, 255, 0.24)',
  brand5: 'rgba(22, 123, 255, 0.32)',
  gray1: 'rgba(255, 255, 255, 1.0)',
  gray2: 'rgba(0, 0, 0, 0.04)',
  gray3: 'rgba(0, 0, 0, 0.08)',
  gray4: 'rgba(0, 0, 0, 0.12)',
  gray5: 'rgba(0, 0, 0, 0.16)',
  gray6: 'rgba(0, 0, 0, 0.20)',
  gray7: 'rgba(0, 0, 0, 0.24)',
  gray8: 'rgba(0, 0, 0, 0.32)',
  gray9: 'rgba(0, 0, 0, 0.38)',
  gray10: 'rgba(0, 0, 0, 0.44)',
  gray11: 'rgba(0, 0, 0, 0.50)',
  gray12: 'rgba(0, 0, 0, 0.56)',
  gray13: 'rgba(0, 0, 0, 0.64)',
  gray14: 'rgba(0, 0, 0, 0.72)',
  gray15: 'rgba(0, 0, 0, 0.80)',
  gray16: 'rgba(0, 0, 0, 1.0)',
  graySolid2: 'rgba(245, 245, 245, 1.0)',
  graySolid3: 'rgba(235, 235, 235, 1.0)',
  green1: 'rgba(0, 215, 36, 0.16)',
  green3: 'rgba(71, 151, 84, 1.0)',
  green4: 'rgba(51, 140, 66, 1.0)',
  green5: 'rgba(40, 167, 61, 1.0)',
  green6: 'rgba(28, 115, 42, 1.0)',
  orange1: 'rgba(255, 132, 0, 0.16)',
  orange2: 'rgba(133, 72, 7, 1.0)',
  pink1: 'rgba(255, 77, 222, 1.0)',
  pink2: 'rgba(255, 16, 211, 1.0)',
  red1: 'rgba(212, 0, 0, 0.08)',
  red2: 'rgba(212, 0, 0, 0.16)',
  red3: 'rgba(212, 0, 0, 1.0)',
  violet1: 'rgba(90, 18, 255, 0.20)',
  violet2: 'rgba(90, 18, 255, 1.0)',
  violet3: 'rgba(90, 18, 255, 0.12)',
  yellow1: 'rgba(255, 242, 0, 0.32)',
  yellow2: 'rgba(127, 121, 0, 1.0)',
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
  shippingBoxLight: '#E8E8E8',
  shippingBoxMid: '#D1D1D1',
  shippingBoxDark: '#9B9B9B',
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
  graySolid2: 'color-gray-solid-2',
  graySolid3: 'color-gray-solid-3',
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

const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

type TypographyWeight = keyof typeof fontWeight;

type TypographyStyle = {
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
};

type TypographyStyleConfig = {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  defaultWeight: TypographyWeight;
};

/**
 * Build a typography style factory with a Figma default weight and optional override.
 *
 * @param config Font size, line height, letter spacing, color, and default weight.
 *
 * @returns Function that returns a typography style object for an optional weight key.
 */
const createTypographyStyle = (config: TypographyStyleConfig) => {
  return (weight: TypographyWeight = config.defaultWeight): TypographyStyle => {
    return {
      fontSize: config.fontSize,
      fontWeight: fontWeight[weight],
      lineHeight: config.lineHeight,
      letterSpacing: config.letterSpacing,
    };
  };
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
      fillDisabled: cssVar('gray11'),
      fillHover: cssVar('gray2'),
      fillSecondary: cssVar('brand3'),
      fillSecondaryHover: cssVar('brand4'),
      fillSpecial: cssVar('blue2'),
      fillSpecial2: cssVar('violet2'),
      fillSpecial2Secondary: cssVar('violet1'),
      fillSpecial3Tertiary: cssVar('violet3'),
      fillSpecialSecondary: cssVar('blue1'),
      fillSuccess: cssVar('green5'),
      fillSuccessSecondary: cssVar('green1'),
      fillTertiary: cssVar('gray9'),
      fillTertiaryHover: cssVar('gray11'),
      fillWarning: cssVar('orange2'),
      fillWarningSecondary: cssVar('orange1'),
      inverse: cssVar('gray16'),
      surface: cssVar('gray1'),
      surfaceAlt: cssVar('gray2'),
      surfaceDisabled: cssVar('gray8'),
      surfaceSecondary: cssVar('gray3'),
      surfaceSubdued: cssVar('gray7'),
      surfaceTertiary: cssVar('gray4'),
      buttonTertiary: cssVar('buttonTertiary'),
      settingsHover: cssVar('settingsHover'),
      placeholderSurface: cssVar('placeholderSurface'),
      galleryHover: cssVar('galleryHover'),
      optionHover: cssVar('optionHover'),
      neutralSurface: cssVar('neutralSurface'),
      badgeDraft: cssVar('badgeDraft'),
      solidSurfaceAlt: cssVar('graySolid2'),
      solidSurfaceSecondary: cssVar('graySolid3'),
    },
    border: {
      default: cssVar('gray4'),
      critical: cssVar('red1'),
      disabled: cssVar('gray6'),
      hover: cssVar('gray5'),
      inverse: cssVar('gray15'),
      ring: cssVar('brand3'),
      secondary: cssVar('gray3'),
      tertiary: cssVar('gray2'),
      alt: cssVar('borderAlt'),
      gallery: cssVar('galleryBorder'),
      muted: cssVar('borderMuted'),
    },
    icon: {
      brand: cssVar('brand1'),
      caution: cssVar('yellow2'),
      critical: cssVar('red3'),
      disabled: cssVar('gray11'),
      emphasis: cssVar('brand1'),
      inverse: cssVar('gray1'),
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
      brand: cssVar('violet2'),
      caution: cssVar('yellow2'),
      critical: cssVar('red3'),
      disabled: cssVar('gray8'),
      emphasis: cssVar('brand1'),
      light: cssVar('gray1'),
      primary: cssVar('gray16'),
      secondary: cssVar('gray14'),
      special: cssVar('pink2'),
      special2: cssVar('blue2'),
      special3: cssVar('violet2'),
      subdued: cssVar('gray12'),
      success: cssVar('green5'),
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
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight,
    heading1: createTypographyStyle({
      fontSize: '36px',
      lineHeight: '40px',
      letterSpacing: '-0.9px',
      defaultWeight: 'extrabold',
    }),
    heading2: createTypographyStyle({
      fontSize: '30px',
      lineHeight: '36px',
      letterSpacing: '-0.75px',
      defaultWeight: 'semibold',
    }),
    heading3: createTypographyStyle({
      fontSize: '24px',
      lineHeight: '32px',
      letterSpacing: '-0.6px',
      defaultWeight: 'semibold',
    }),
    heading4: createTypographyStyle({
      fontSize: '18px',
      lineHeight: '26px',
      letterSpacing: '0px',
      defaultWeight: 'semibold',
    }),
    heading5: createTypographyStyle({
      fontSize: '16px',
      lineHeight: '22px',
      letterSpacing: '-2%',
      defaultWeight: 'semibold',
    }),
    heading6: createTypographyStyle({
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '-2%',
      defaultWeight: 'semibold',
    }),
    paragraph: createTypographyStyle({
      fontSize: '14px',
      lineHeight: '22px',
      letterSpacing: '0',
      defaultWeight: 'normal',
    }),
    small: createTypographyStyle({
      fontSize: '13px',
      lineHeight: '20px',
      letterSpacing: '0',
      defaultWeight: 'normal',
    }),
    tiny: createTypographyStyle({
      fontSize: '12px',
      lineHeight: '18px',
      letterSpacing: '0',
      defaultWeight: 'normal',
    }),
    micro: createTypographyStyle({
      fontSize: '10px',
      lineHeight: '14px',
      letterSpacing: '0',
      defaultWeight: 'normal',
    }),
    large: createTypographyStyle({
      fontSize: '18px',
      lineHeight: '28px',
      letterSpacing: '0',
      defaultWeight: 'semibold',
    }),
    lead: createTypographyStyle({
      fontSize: '20px',
      lineHeight: '30px',
      letterSpacing: '0',
      defaultWeight: 'normal',
    }),
  },
  spacing: {
    0: '0', // 0px
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px
    12: '3rem', // 48px
  },
  radius: {
    none: '0', // 0px
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px,
    xxl: '1rem', // 16px,
    full: '9999px',
  },
  shadow: {
    none: 'none',
    default: '0px 1px 3px 0px hsla(0, 0%, 0%, 0.1), 0px 1px 2px -1px hsla(0, 0%, 0%, 0.1)',
    sm: '0px 1px 2px 0px hsla(0, 0%, 0%, 0.05)',
    md: '0px 4px 6px -1px hsla(0, 0%, 0%, 0.1), 0px 2px 4px -2px hsla(0, 0%, 0%, 0.1)',
    lg: '0px 10px 15px -3px hsla(0, 0%, 0%, 0.1), 0px 4px 6px -4px hsla(0, 0%, 0%, 0.1)',
    popover: `0px 0px 4px 0px rgba(0, 0, 0, 0.08),
      0px 4px 12px 0px rgba(0, 0, 0, 0.08),
      0px 2px 4px -2px rgba(0, 0, 0, 0.08),
      0px 1.5px 0px 0px rgba(255, 255, 255, 0.08) inset`,
  },
  // WordPress's own chrome sits at #adminmenu(back) z-index 9990 and
  // #wpadminbar z-index 99999. Every layer here that renders position:fixed
  // (dropdown/tooltip/toast) is calculated to clear the admin bar so wp-admin's
  // UI can never sit on top of ours; layers scoped to our own page flow
  // (sticky, dialog) don't need to, since they never visually collide with it.
  zIndex: {
    sticky: 100, // in-app sticky headers, e.g. page-heading, filter-popup panels
    dialogOverlay: 1000,
    dialogContent: 1001,
    dropdown: 100000, // select / popover / dropdown-menu content — clears #wpadminbar (99999)
    tooltip: 100100, // must float above dialogs and dropdowns
    toast: 100200, // persistent app notifications — always on top
  },
} as const;

type AppTheme = typeof theme;
type SpacingKey = keyof typeof theme.spacing;

export { CSS_VAR_PREFIX, getCssVarName, PRIMITIVE_CSS_VAR_KEYS, theme };
export type { AppTheme, PrimitiveColorKey, SpacingKey, TypographyStyle, TypographyWeight };
