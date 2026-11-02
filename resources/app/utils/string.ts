import { isDefined } from '@/utils/object';

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const toDisplayString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

export const incrementString = (value: string | undefined, by?: string | number): string => {
  if (!isDefined(value)) {
    return '';
  }

  if (isDefined(by)) {
    return value.slice(0, -1) + by;
  }

  const match = /^(\D*)(\d*)$/.exec(value);
  if (!match) return value;

  const [, prefix, digits] = match;
  if (!digits) return `${value}1`;

  const incremented = (BigInt(digits) + 1n).toString();
  const padded = incremented.padStart(digits.length, '0');

  return prefix + padded;
};
