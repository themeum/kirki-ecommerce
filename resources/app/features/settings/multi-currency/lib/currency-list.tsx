import type { ReactNode } from 'react';

import type { Currency } from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { CurrencyBulkPayload } from '@/features/settings/multi-currency/services/currency';
import { IncreaseIcon } from '@/icons';
import type { SelectOption } from '@/types/components/common';
import { __ } from '@/wpi18n';

export type CurrencyListItem = Currency & {
  badge1?: string;
  is_toggle_disabled?: boolean;
  is_action_disabled?: boolean;
  rightIcon?: ReactNode;
  rightText?: string;
  icon?: ReactNode;
  actionsArray?: SelectOption[];
};

/**
 * The base currency can't be disabled, deleted, or set as base again —
 * only a non-base currency offers row actions.
 */
export const getActionArray = (item: Currency): SelectOption[] => {
  if (item?.is_base) {
    return [];
  }
  return [
    { title: __('Edit', 'kirki-ecommerce'), value: 'edit' },
    { title: __('Delete', 'kirki-ecommerce'), value: 'delete' },
    { title: __('Set as base currency', 'kirki-ecommerce'), value: 'set_base' },
  ];
};

/**
 * Enriches each raw currency with the row's display fields: an icon, a
 * formatted exchange rate, and its available row actions.
 */
export const buildCurrencyListItems = (rawCurrencies: Currency[]): CurrencyListItem[] =>
  rawCurrencies.map((item) => ({
    ...item,
    ...(item?.is_base && {
      is_toggle_disabled: true,
      is_action_disabled: true,
    }),
    is_enabled: item?.is_active,
    rightIcon: <IncreaseIcon />,
    rightText: item?.exchange_rate != null ? String(item.exchange_rate) : undefined,
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
      items: [
        {
          ...selectedCurrency,
          is_active: selectedCurrency?.is_active ?? true,
          is_base: selectedCurrency?.is_base ?? false,
          [key]: !selectedCurrency[key],
        },
      ],
    };
  }

  return {
    items: currencyList.map((currency) => ({
      ...currency,
      is_base: currency?.id === item?.id,
      is_active: currency?.is_active ?? true,
    })),
  };
};
