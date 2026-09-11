import z from 'zod';

import {
  type CurrencyDraft,
  CurrencySchema,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { CurrencyRateItem } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import type { CurrencyBulkPayload } from '@/features/settings/multi-currency/services/currency';

export const CurrencyListItemSchema = CurrencySchema.extend({
  id: z.number().optional(),
  is_toggle_disabled: z.boolean().optional(),
  is_action_disabled: z.boolean().optional(),
});

export type CurrencyListItem = z.infer<typeof CurrencyListItemSchema>;

export const toCurrencyDraft = (item: CurrencyListItem): CurrencyDraft => ({
  id: item.id,
  name: item.name,
  code: item.code,
  symbol: item.symbol,
  exchange_rate: item.exchange_rate,
  is_base: item.is_base ?? false,
  is_active: item.is_active ?? true,
});

export const buildCurrencyListItems = (currencies: CurrencyRateItem[]): CurrencyListItem[] =>
  currencies.map((item) => ({
    ...item,
    ...(item?.is_base && {
      is_toggle_disabled: true,
      is_action_disabled: true,
    }),
    is_enabled: item?.is_active,
    icon: item?.symbol,
  }));

export const buildCurrencyUpdatePayload = (
  currencyList: CurrencyListItem[],
  item: CurrencyListItem,
  key: keyof CurrencyRateItem,
): CurrencyBulkPayload | null => {
  if (key !== 'is_base') {
    const selectedCurrency = currencyList.find((currency) => currency?.id === item?.id);
    if (!selectedCurrency) {
      return null;
    }

    return {
      items: [toCurrencyDraft({ ...selectedCurrency, [key]: !selectedCurrency[key] })],
    };
  }

  return {
    items: currencyList.map((currency) =>
      toCurrencyDraft({ ...currency, is_base: currency?.id === item?.id }),
    ),
  };
};
