import { useWatch } from 'react-hook-form';

import {
  buildCurrencyListItems,
  buildCurrencyUpdatePayload,
  type CurrencyListItem,
  getProviderConfig,
  getSyncStatus,
  type SyncStatus,
} from '@/features/settings/multi-currency/lib/currency-list';
import type {
  CurrencyRateItem,
  MultiCurrencySettingsFormInput,
} from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import {
  type CurrencyBulkPayload,
  useAvailableCurrenciesQuery,
  useCurrencyExchangeProvidersQuery,
  useDeleteCurrencyMutation,
  useUpdateCurrencyMutation,
} from '@/features/settings/multi-currency/services/currency';

type UseAvailableCurrencyListResult = {
  currencyList: CurrencyListItem[];
  baseCurrencyCode: string | undefined;
  syncStatus: SyncStatus;
  updateData: (payload: CurrencyBulkPayload | null) => void;
  handleToggleCurrencyItem: (item: CurrencyListItem) => void;
  handleDeleteCurrencyItem: (item: CurrencyListItem) => void;
  handleAction: (action: 'delete' | 'status' | 'set_base', item: CurrencyListItem) => void;
};

export const useAvailableCurrencyList = (): UseAvailableCurrencyListResult => {
  const settings = useWatch<MultiCurrencySettingsFormInput>();
  const currencies = useWatch<MultiCurrencySettingsFormInput, 'currencies'>({ name: 'currencies' });

  const { refetch } = useAvailableCurrenciesQuery({ limit: -1 }, false);
  const { data: providers } = useCurrencyExchangeProvidersQuery();
  const { mutate: updateCurrencyMutate } = useUpdateCurrencyMutation();
  const { mutate: deleteCurrencyMutate } = useDeleteCurrencyMutation();

  const syncStatus = getSyncStatus({
    apiProvider: settings?.api_provider,
    providerName: providers?.find((provider) => provider.id === settings?.api_provider)?.name ?? '',
    hasApiKey: Boolean(getProviderConfig(settings?.api_configs, settings?.api_provider)?.api_key),
    isAutomaticUpdateEnabled: Boolean(settings?.is_automatic_update_enabled),
    lastSyncAt: settings?.last_sync_at,
    nextSyncAt: settings?.next_sync_at,
    lastSyncError: settings?.last_sync_error,
    lastSyncErrorAt: settings?.last_sync_error_at,
  });

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
    syncStatus,
    updateData,
    handleDeleteCurrencyItem,
    handleToggleCurrencyItem,
    handleAction,
  };
};
