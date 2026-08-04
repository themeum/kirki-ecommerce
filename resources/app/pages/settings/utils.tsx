import type { ReactNode } from 'react';
import { CircleDollarSign, CreditCard, Home, KeyRound, Mail, Package, Percent, Settings2, ShoppingCart, Snowflake, Truck } from 'lucide-react';

import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

export type SettingsNavItem = {
  link: string;
  icon: ReactNode;
  header: string;
  subHeader: string;
  disabled?: boolean;
};

type SearchableItem = {
  name?: string;
  value?: string | number;
  title?: string;
  id?: string | number;
  code?: string;
  color?: string | null;
  [key: string]: unknown;
};

type GetSortedListParams<T> = {
  data?: T[];
  key?: string;
  order?: 'asc' | 'desc';
};

export const weightUnitList: SelectOption[] = [
  { title: __('Kilogram (kg)', 'kirki-ecommerce'), value: 'kg' },
  { title: __('Gram', 'kirki-ecommerce'), value: 'g' },
  { title: __('Pound', 'kirki-ecommerce'), value: 'lb' },
  { title: __('Ounce', 'kirki-ecommerce'), value: 'oz' },
];

export const dimensionUnitList: SelectOption[] = [
  { title: __('Centimeter (cm)', 'kirki-ecommerce'), value: 'cm' },
  { title: __('Inch (in)', 'kirki-ecommerce'), value: 'in' },
  { title: __('Millimeter (mm)', 'kirki-ecommerce'), value: 'mm' },
  { title: __('Meter (m)', 'kirki-ecommerce'), value: 'm' },
];

export const getSortedList = <T extends Record<string, unknown>>({
  data = [],
  key = 'name',
  order = 'asc',
}: GetSortedListParams<T>): T[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = String(a?.[key] ?? '').toLowerCase();
    const bVal = String(b?.[key] ?? '').toLowerCase();

    if (aVal < bVal) {
      return order === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
};

export const getSearchedValue = <T extends SearchableItem>(
  value: string | number | null | undefined,
  data: T[] = [],
): T[] => {
  if (!value) {
    return data;
  }
  const search = String(value).toLowerCase().trim();

  return data.filter((item) => {
    const name = String(item?.name ?? '').toLowerCase();
    const itemValue = String(item?.value ?? '').toLowerCase();
    const title = String(item?.title ?? '').toLowerCase();
    const id = String(item?.id ?? '').toLowerCase();
    const code = String(item?.code ?? '').toLowerCase();
    const color = String(item?.color ?? '').toLowerCase();
    return (
      name.includes(search) ||
      itemValue.includes(search) ||
      title.includes(search) ||
      id.includes(search) ||
      code.includes(search) ||
      color.includes(search)
    );
  });
};

export const getNestedSearchedValue = <T extends SearchableItem>(
  value: string,
  data: T[] = [],
  nestedKeys: string[] = [],
): T[] => {
  if (!value) {
    return data;
  }

  const search = value.toLowerCase().trim();

  return data.reduce<T[]>((acc, item) => {
    const parentMatch = item?.name?.toLowerCase().includes(search);

    const matchedChildren = nestedKeys.reduce<Record<string, unknown[]>>(
      (childAcc, key) => {
        const nested = item[key];
        if (!Array.isArray(nested)) {
          return childAcc;
        }

        const matches = nested.filter((child) => {
          const nestedChild = child as SearchableItem;
          return nestedChild?.name?.toLowerCase().includes(search);
        });

        if (matches.length) {
          childAcc[key] = matches;
        }

        return childAcc;
      },
      {},
    );

    if (parentMatch || Object.keys(matchedChildren).length) {
      acc.push({
        ...item,
        ...matchedChildren,
      });
    }

    return acc;
  }, []);
};

export const getSearchedCountries = <T extends SearchableItem>(
  searchValue: string,
  countryList: T[],
): T[] => {
  if (!searchValue) {
    return countryList;
  }
  return getNestedSearchedValue(searchValue, countryList, ['states']);
};

const navIconProps = { size: 16, strokeWidth: 1.5, 'aria-hidden': true as const };

export const storeManagementSettings: SettingsNavItem[] = [
  {
    link: '/settings/general',
    icon: <Home {...navIconProps} />,
    header: __('General', 'kirki-ecommerce'),
    subHeader: __('Basic settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '/settings/products',
    icon: <Package {...navIconProps} />,
    header: __('Products', 'kirki-ecommerce'),
    subHeader: __('Product-related configurations', 'kirki-ecommerce'),
  },
];

export const businessOperationSettings: SettingsNavItem[] = [
  {
    link: '/settings/shipping',
    icon: <Truck {...navIconProps} />,
    header: __('Shipping', 'kirki-ecommerce'),
    subHeader: __('Delivery, pickup, and logistics setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/currency',
    icon: <CircleDollarSign {...navIconProps} />,
    header: __('Currency', 'kirki-ecommerce'),
    subHeader: __('Tax zones and rules setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/tax',
    icon: <Percent {...navIconProps} />,
    header: __('Tax', 'kirki-ecommerce'),
    subHeader: __('Tax zones and rules setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/payments',
    icon: <CreditCard {...navIconProps} />,
    header: __('Payments', 'kirki-ecommerce'),
    subHeader: __('Configure how you accept payments', 'kirki-ecommerce'),
  },
  {
    link: '/settings/email',
    icon: <Mail {...navIconProps} />,
    header: __('Emails', 'kirki-ecommerce'),
    subHeader: __(
      'Order confirmations, receipts, and other customer emails',
      'kirki-ecommerce',
    ),
  },
  {
    link: '/settings/checkout',
    icon: <ShoppingCart {...navIconProps} />,
    header: __('Checkout', 'kirki-ecommerce'),
    subHeader: __('Guest checkout and legal information', 'kirki-ecommerce'),
  },
];

export const advancedSettings: SettingsNavItem[] = [
  {
    link: '/settings/advanced',
    icon: <Settings2 {...navIconProps} />,
    header: __('Advanced', 'kirki-ecommerce'),
    subHeader: __('Advanced settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '/settings/essentials',
    icon: <Snowflake {...navIconProps} />,
    header: __('Essentials', 'kirki-ecommerce'),
    subHeader: __('Advanced settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '/settings/license',
    icon: <KeyRound {...navIconProps} />,
    header: __('License', 'kirki-ecommerce'),
    subHeader: __('Basic settings of your store', 'kirki-ecommerce'),
  },
];

export { setUnsavedDataStatus } from '@/libs/unsaved-store';
