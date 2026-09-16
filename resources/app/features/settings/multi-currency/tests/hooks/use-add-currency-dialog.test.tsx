import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAddCurrencyDialog } from '@/features/settings/multi-currency/hooks/use-add-currency-dialog';
import type {
  Currency,
  CurrencyOption,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';

const queryData: {
  availableCurrencies: Currency[] | undefined;
  allCurrencies: CurrencyOption[] | undefined;
} = {
  availableCurrencies: undefined,
  allCurrencies: undefined,
};

vi.mock('@/features/settings/multi-currency/services/currency', () => ({
  useAvailableCurrenciesQuery: () => ({ data: queryData.availableCurrencies }),
  useAllCurrenciesQuery: () => ({ data: queryData.allCurrencies }),
}));

const Wrapper = ({ children }: { children: ReactNode }) => {
  const form = useForm<MultiCurrencySettingsFormInput>({
    defaultValues: { currencies: [] },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
};

beforeEach(() => {
  queryData.availableCurrencies = undefined;
  queryData.allCurrencies = undefined;
});

describe('useAddCurrencyDialog', () => {
  it('settles without re-rendering forever while the currency queries have no data', () => {
    const { result } = renderHook(() => useAddCurrencyDialog(), { wrapper: Wrapper });

    expect(result.current.filteredCurrency).toEqual([]);
  });

  it('offers every unadded currency until a search narrows the list', () => {
    queryData.availableCurrencies = [{ id: 1, name: 'US Dollar', code: 'USD' }];
    queryData.allCurrencies = [
      { name: 'US Dollar', code: 'USD' },
      { name: 'Euro', code: 'EUR' },
      { name: 'Pound Sterling', code: 'GBP' },
    ];

    const { result } = renderHook(() => useAddCurrencyDialog(), { wrapper: Wrapper });

    expect(result.current.filteredCurrency.map((item) => item.code)).toEqual(['EUR', 'GBP']);

    act(() => {
      result.current.handleSearchCurrency({ target: { value: 'pound' } });
    });

    expect(result.current.searchValue).toBe('pound');
    expect(result.current.filteredCurrency.map((item) => item.code)).toEqual(['GBP']);

    act(() => {
      result.current.handleSearchCurrency({ target: { value: '' } });
    });

    expect(result.current.filteredCurrency.map((item) => item.code)).toEqual(['EUR', 'GBP']);
  });
});
