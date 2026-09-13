import { useWatch } from 'react-hook-form';

import {
  buildCurrencyListItems,
  buildCurrencyUpdatePayload,
  type CurrencyListItem,
} from '@/features/settings/multi-currency/lib/currency-list';
import type {
  CurrencyRateItem,
  MultiCurrencySettingsFormInput,
} from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
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
  nextSyncAt: string | null | undefined;
  updateData: (payload: CurrencyBulkPayload | null) => void;
  handleToggleCurrencyItem: (item: CurrencyListItem) => void;
  handleDeleteCurrencyItem: (item: CurrencyListItem) => void;
  handleAction: (action: 'delete' | 'status' | 'set_base', item: CurrencyListItem) => void;
};

export const useAvailableCurrencyList = (): UseAvailableCurrencyListResult => {
  const settings = useWatch<MultiCurrencySettingsFormInput>();
  const currencies = useWatch<MultiCurrencySettingsFormInput, 'currencies'>({ name: 'currencies' });

  const { refetch } = useAvailableCurrenciesQuery();
  const { mutate: updateCurrencyMutate } = useUpdateCurrencyMutation();
  const { mutate: deleteCurrencyMutate } = useDeleteCurrencyMutation();

  const showApiProviderStatus = Boolean(
    settings?.api_provider && settings?.api_config?.api_key && settings?.last_sync_at,
  );

  const currencyList = buildCurrencyListItems(currencies ?? []);
  const baseCurrencyCode = currencyList.find((currency) => currency?.is_base)?.code;

  const updateData: UseAvailableCurrencyListResult['updateData'] = (payload) => {
    if (!payload) {
      return;
    }
    updateCurrencyMutate(payload, {
      onSuccess: () => refetch(),
    });
  };

  const updateCurrencyList = (item: CurrencyListItem, key: keyof CurrencyRateItem) => {
    updateData(buildCurrencyUpdatePayload(currencyList, item, key));
  };

  const handleDeleteCurrencyItem = (item: CurrencyListItem) => {
    if (item.id === undefined) {
      return;
    }
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
    lastSyncAt: settings?.last_sync_at,
    nextSyncAt: settings?.next_sync_at,
    updateData,
    handleDeleteCurrencyItem,
    handleToggleCurrencyItem,
    handleAction,
  };
};
