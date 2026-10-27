import { useAppConfig } from '@/contexts/app-config-context';
import type { AppConfig } from '@/schemas/catalog/app-config';

type BaseCurrency = NonNullable<AppConfig['base_currency']>;

/**
 * The store's base currency, or null while the app config is still loading
 * or when none is configured.
 */
const useBaseCurrency = (): BaseCurrency | null => {
  const { settings } = useAppConfig();

  return settings?.base_currency ?? null;
};

/**
 * The base currency's symbol, or an empty string when it is not resolved
 * yet — never a hardcoded symbol, which would misrepresent the store.
 */
const useBaseCurrencySymbol = (): string => {
  return useBaseCurrency()?.symbol ?? '';
};

const useCurrencyPreferences = () => {
  const { settings } = useAppConfig();

  return settings?.currency_preferences ?? null;
};

const DEFAULT_FRACTION_DIGITS = 2;
const COMPACT_THRESHOLD = 1000;

const resolveSeparator = (separator: string): string => {
  return separator === 'space' ? ' ' : separator;
};

const getFractionDigits = (code?: string): number => {
  if (!code) {
    return DEFAULT_FRACTION_DIGITS;
  }

  const { maximumFractionDigits } = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).resolvedOptions();

  return maximumFractionDigits ?? DEFAULT_FRACTION_DIGITS;
};

const useFormatCurrency = () => {
  const base = useBaseCurrency();
  const preferences = useCurrencyPreferences();

  return (amount: number | string): string => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return '--';
    }

    const decimalSeparator = resolveSeparator(preferences?.decimal_separator ?? '.');
    const thousandSeparator = resolveSeparator(preferences?.thousand_separator ?? ',');
    const position = preferences?.currency_position ?? 'before';
    const symbol = base?.symbol ?? '';
    const digits = getFractionDigits(base?.code);
    const isCompact =
      (preferences?.currency_format ?? 'short') === 'short' && Math.abs(value) >= COMPACT_THRESHOLD;

    const formatter = new Intl.NumberFormat(
      'en-US',
      isCompact
        ? { notation: 'compact', maximumFractionDigits: 1 }
        : { minimumFractionDigits: digits, maximumFractionDigits: digits },
    );

    const formatted = formatter
      .formatToParts(value)
      .map((part) => {
        if (part.type === 'group') {
          return thousandSeparator;
        }

        if (part.type === 'decimal') {
          return decimalSeparator;
        }

        return part.value;
      })
      .join('');

    return position === 'before' ? `${symbol}${formatted}` : `${formatted}${symbol}`;
  };
};

export default useBaseCurrency;
export { useBaseCurrencySymbol, useCurrencyPreferences, useFormatCurrency };
export type { BaseCurrency };
