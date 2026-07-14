import type { ReactNode } from 'react';

import {
  AdvancedSettingsIcon,
  BoxIcon,
  ClipboardListIcon,
  CurrencyIcon,
  EmailIcon,
  HomeIcon,
  LicenseKeyIcon,
  PaymentIcon,
  SnowflakeIcon,
  TaxIcon,
  TruckIcon,
} from '@/icons';
import { setUnsavedDataStatus as setStatus } from '@/libs/unsaved-store';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

export type SettingsNavItem = {
  link: string;
  icon: ReactNode;
  header: string;
  subHeader: string;
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

type CheckUnsavedDataStatusParams = {
  initialDataObj: unknown;
  updatedDataObj: unknown;
  keysToCompare?: string[] | null;
  onUnsaved?: () => void;
  onClean?: () => void;
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

export const storeManagementSettings: SettingsNavItem[] = [
  {
    link: '/settings/general',
    icon: <HomeIcon />,
    header: __('General', 'kirki-ecommerce'),
    subHeader: __('Basic settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '/settings/products',
    icon: <BoxIcon />,
    header: __('Products', 'kirki-ecommerce'),
    subHeader: __('Product-related configurations', 'kirki-ecommerce'),
  },
  {
    link: '',
    icon: <ClipboardListIcon />,
    header: __('Orders', 'kirki-ecommerce'),
    subHeader: __('Order-related configurations', 'kirki-ecommerce'),
  },
  {
    link: '/settings/checkout',
    icon: <ClipboardListIcon />,
    header: __('Checkout', 'kirki-ecommerce'),
    subHeader: __('Text needs to be updated', 'kirki-ecommerce'),
  },
];

export const businessOperationSettings: SettingsNavItem[] = [
  {
    link: '/settings/shipping',
    icon: <TruckIcon />,
    header: __('Shipping', 'kirki-ecommerce'),
    subHeader: __('Delivery, pickup, and logistics setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/currency',
    icon: <CurrencyIcon />,
    header: __('Currency', 'kirki-ecommerce'),
    subHeader: __('Currency setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/tax',
    icon: <TaxIcon />,
    header: __('Tax', 'kirki-ecommerce'),
    subHeader: __('Tax zones and rules setup', 'kirki-ecommerce'),
  },
  {
    link: '/settings/payments',
    icon: <PaymentIcon />,
    header: __('Payments', 'kirki-ecommerce'),
    subHeader: __('Configure how you accept payments', 'kirki-ecommerce'),
  },
  {
    link: '/settings/email',
    icon: <EmailIcon />,
    header: __('Emails', 'kirki-ecommerce'),
    subHeader: __(
      'Order confirmations, receipts, and other customer emails',
      'kirki-ecommerce',
    ),
  },
];

export const advancedSettings: SettingsNavItem[] = [
  {
    link: '',
    icon: <AdvancedSettingsIcon />,
    header: __('Advanced', 'kirki-ecommerce'),
    subHeader: __('Advanced settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '/settings/essentials',
    icon: <SnowflakeIcon />,
    header: __('Essentials', 'kirki-ecommerce'),
    subHeader: __('Advanced settings of your store', 'kirki-ecommerce'),
  },
  {
    link: '',
    icon: <LicenseKeyIcon />,
    header: __('License', 'kirki-ecommerce'),
    subHeader: __('Basic settings of your store', 'kirki-ecommerce'),
  },
];

export const checkUnsavedDataStatus = ({
  initialDataObj,
  updatedDataObj,
  keysToCompare = null,
  onUnsaved = () => {},
  onClean = () => {},
}: CheckUnsavedDataStatusParams): boolean => {
  const isEqual = (
    a: unknown,
    b: unknown,
    keys: string[] | null = null,
  ): boolean => {
    if (a === b) {
      return true;
    }
    if (typeof a !== typeof b) {
      return false;
    }

    if (a && b && typeof a === 'object') {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
          return false;
        }
        return a.every((item, index) => isEqual(item, b[index], keys));
      }

      if (!Array.isArray(a) && !Array.isArray(b)) {
        const aObj = a as Record<string, unknown>;
        const bObj = b as Record<string, unknown>;
        const aKeys = keys || Object.keys(aObj);
        return aKeys.every((key) => isEqual(aObj[key], bObj[key]));
      }

      return false;
    }

    return false;
  };

  const hasUnsavedChanges = !isEqual(
    initialDataObj,
    updatedDataObj,
    keysToCompare,
  );

  if (hasUnsavedChanges) {
    onUnsaved();
  } else {
    setStatus(false);
    onClean();
  }

  return hasUnsavedChanges;
};

export { setUnsavedDataStatus } from '@/libs/unsaved-store';
