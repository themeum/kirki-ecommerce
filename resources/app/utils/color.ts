import { COLOR_NAME_HEX } from '@/utils/color-names';

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const HEX_ALPHA_PATTERN = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

type HexOptions = {
  alpha?: boolean;
};

export const normalizeHex = (value: string): string => {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

export const isValidHex = (value: string, options: HexOptions = {}): boolean => {
  const pattern = options.alpha ? HEX_ALPHA_PATTERN : HEX_PATTERN;

  return pattern.test(normalizeHex(value));
};

export const getHexFromColorName = (value: string): string => {
  const name = value.trim().toLowerCase().replace(/[\s-]+/g, '');
  const hex = COLOR_NAME_HEX[name];

  return typeof hex === 'string' ? hex : '';
};
