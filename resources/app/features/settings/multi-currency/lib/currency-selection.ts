import type { CurrencyDraft, CurrencyOption } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { toDisplayString } from '@/utils/string';

/**
 * The currencies offered in the "add currency" picker: every known
 * currency minus the ones already added to the store.
 */
export const filterUnaddedCurrencies = (
  allCurrencies: CurrencyOption[],
  availableCurrencies: { code: string }[],
): CurrencyOption[] => {
  const availableCodes = new Set(
    availableCurrencies.map((item) => item.code.toLowerCase()),
  );

  return allCurrencies.filter((item) => !availableCodes.has(item.code.toLowerCase()));
};

/**
 * Toggles a currency in/out of the draft selection, seeding a newly
 * selected one as inactive and non-base until the user configures it.
 */
export const toggleCurrencySelection = (
  current: CurrencyDraft[],
  currency: CurrencyOption,
): CurrencyDraft[] => {
  const exists = current.some((item) => item.name === currency.name);
  return exists
    ? current.filter((item) => item.name !== currency.name)
    : [...current, { ...currency, is_base: false, is_active: true }];
};

/**
 * The search input can be handed either a change event or a raw string
 * (see call sites in `add-currency-dialog.tsx`) — normalizes both to a
 * plain string.
 */
export const resolveSearchInputValue = (event: unknown): string => {
  const eventValue =
    typeof event === 'object' && event !== null && 'target' in event
      ? (event as { target?: { value?: string } })?.target?.value
      : event;

  return toDisplayString(eventValue);
};
