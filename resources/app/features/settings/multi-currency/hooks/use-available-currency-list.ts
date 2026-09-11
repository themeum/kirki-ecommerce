import { useWatch } from 'react-hook-form';

import {
  buildCurrencyListItems,
  buildCurrencyUpdatePayload,
  type CurrencyListItem,
} from '@/features/settings/multi-currency/lib/currency-list';
import type { Currency } from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import {
  type CurrencyBulkPayload,
  useAvailableCurrenciesQuery,
  useDeleteCurrencyMutation,
  useUpdateCurrencyMutation,
} from '@/features/settings/multi-currency/services/currency';

type UseAvailableCurrencyListResult = {
  currencyList: CurrencyListItem[];
  baseCurrencyCode: string | undefined;
  showApiProviderStatus: boolean;
  lastSyncAt: string | null | undefined;
  updateData: (payload: CurrencyBulkPayload | null) => void;
  handleToggleCurrencyItem: (item: CurrencyListItem) => void;
  handleDeleteCurrencyItem: (item: CurrencyListItem) => void;
  handleAction: (action: 'delete' | 'status' | 'set_base', item: CurrencyListItem) => void;
};

export const useAvailableCurrencyList = (): UseAvailableCurrencyListResult => {
  const dataObj = useWatch<MultiCurrencySettingsFormInput>();

  const { data: rawCurrencies = [], refetch } = useAvailableCurrenciesQuery();
  const { mutate: updateCurrencyMutate } = useUpdateCurrencyMutation();
  const { mutate: deleteCurrencyMutate } = useDeleteCurrencyMutation();

  const showApiProviderStatus = Boolean(dataObj?.api_provider && dataObj?.last_sync_at);

  const currencyList = buildCurrencyListItems(rawCurrencies);
  const baseCurrencyCode = currencyList.find((currency) => currency?.is_base)?.code;

  const updateData: UseAvailableCurrencyListResult['updateData'] = (payload) => {
    if (!payload) {
      return;
    }
    updateCurrencyMutate(payload, {
      onSuccess: () => refetch(),
    });
  };

  const updateCurrencyList = (item: CurrencyListItem, key: keyof Currency) => {
    updateData(buildCurrencyUpdatePayload(currencyList, item, key));
  };

  const handleDeleteCurrencyItem = (item: CurrencyListItem) => {
    deleteCurrencyMutate(item.id, {
      onSuccess: () => refetch(),
    });
  };

  const handleToggleCurrencyItem = (item: CurrencyListItem) => {
    updateCurrencyList(item, 'is_active');
  };

  const handleAction = (action: 'delete' | 'status' | 'set_base', item: CurrencyListItem) => {
    if (action === 'delete') {
      handleDeleteCurrencyItem(item);
    } else if (action === 'status') {
      handleToggleCurrencyItem(item);
    } else if (action === 'set_base') {
      updateCurrencyList(item, 'is_base');
    }
  };

  return {
    currencyList,
    baseCurrencyCode,
    showApiProviderStatus,
    lastSyncAt: dataObj?.last_sync_at,
    updateData,
    handleDeleteCurrencyItem,
    handleToggleCurrencyItem,
    handleAction,
  };
};
