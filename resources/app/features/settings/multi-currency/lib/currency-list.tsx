import type { ReactNode } from 'react';

import type { Currency, CurrencyDraft } from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { CurrencyBulkPayload } from '@/features/settings/multi-currency/services/currency';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

export type CurrencyListItem = Currency & {
  badge1?: string;
  is_toggle_disabled?: boolean;
  is_action_disabled?: boolean;
  icon?: ReactNode;
  actionsArray?: SelectOption[];
};

/**
 * Strips a list item down to the currency fields the write endpoint
 * accepts — the enriched row carries display-only values (`icon`,
 * `actionsArray`) that must never reach a `PUT /currencies` body.
 */
export const toCurrencyDraft = (item: CurrencyListItem): CurrencyDraft => ({
  id: item.id,
  name: item.name,
  code: item.code,
  symbol: item.symbol,
  exchange_rate: item.exchange_rate,
  is_base: item.is_base ?? false,
  is_active: item.is_active ?? true,
});

/**
 * The base currency can't be disabled, deleted, or set as base again —
 * only a non-base currency offers row actions.
 */
export const getActionArray = (item: Currency): SelectOption[] => {
  if (item?.is_base) {
    return [];
  }
  return [
    { title: __('Delete', 'kirki-ecommerce'), value: 'delete' },
    { title: __('Set as base currency', 'kirki-ecommerce'), value: 'set_base' },
  ];
};

/**
 * Enriches each raw currency with the row's display fields: an icon and
 * its available row actions.
 */
export const buildCurrencyListItems = (rawCurrencies: Currency[]): CurrencyListItem[] =>
  rawCurrencies.map((item) => ({
    ...item,
    ...(item?.is_base && {
      is_toggle_disabled: true,
      is_action_disabled: true,
    }),
    is_enabled: item?.is_active,
    icon: item?.symbol,
    actionsArray: getActionArray(item),
  }));

/**
 * The bulk-update payload for a row-level change: toggling a boolean flag
 * on one currency, or — for `is_base` — reassigning the base currency
 * across the whole list, since only one currency may be base at a time.
 */
export const buildCurrencyUpdatePayload = (
  currencyList: CurrencyListItem[],
  item: CurrencyListItem,
  key: keyof Currency,
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
