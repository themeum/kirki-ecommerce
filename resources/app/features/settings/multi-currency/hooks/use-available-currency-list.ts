import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { buildCurrencyListItems, buildCurrencyUpdatePayload, type CurrencyListItem } from '@/features/settings/multi-currency/lib/currency-list';
import type { Currency } from '@/features/settings/multi-currency/schemas/catalog/currency';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { type CurrencyBulkPayload, useAvailableCurrenciesQuery, useDeleteCurrencyMutation, useUpdateCurrencyMutation } from '@/features/settings/multi-currency/services/currency';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

type EditCurrencyItem = Currency & { icon?: string | null };

type UseAvailableCurrencyListResult = {
  currencyList: CurrencyListItem[];
  showApiProviderStatus: boolean;
  lastSyncAt: string | null | undefined;
  nextSyncAt: string | null | undefined;
  editCurrency: EditCurrencyItem | null;
  setEditCurrency: Dispatch<SetStateAction<EditCurrencyItem | null>>;
  updateData: (payload: CurrencyBulkPayload | null) => void;
  handleToggleCurrencyItem: (item: CurrencyListItem) => void;
  handleDeleteCurrencyItem: (item: CurrencyListItem) => void;
  handleAction: (
    action: string | number | (string | number)[],
    item: CurrencyListItem,
  ) => void;
};

export const useAvailableCurrencyList = (): UseAvailableCurrencyListResult => {
  const [editCurrency, setEditCurrency] = useState<EditCurrencyItem | null>(null);
  const dataObj = useWatch<MultiCurrencySettingsFormInput>();

  const { data: rawCurrencies = [], refetch } = useAvailableCurrenciesQuery();
  const { mutate: updateCurrencyMutate } = useUpdateCurrencyMutation();
  const { mutate: deleteCurrencyMutate } = useDeleteCurrencyMutation();

  const showApiProviderStatus = Boolean(
    dataObj?.is_automatic_update_enabled === true &&
    dataObj?.api_provider &&
    dataObj?.last_sync_at &&
    dataObj?.next_sync_at,
  );

  const currencyList = buildCurrencyListItems(rawCurrencies);

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

  const handleToggleCurrencyItem = (item: CurrencyListItem) => {
    updateCurrencyList(item, 'is_active');
  };

  const handleDeleteCurrencyItem = (item: CurrencyListItem) => {
    dispatchToastMessage('delete', {
      title: __('Currency deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => refetch(),
      onSuccess: () => {
        deleteCurrencyMutate(item.id, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handleAction = (
    action: string | number | (string | number)[],
    item: CurrencyListItem,
  ) => {
    if (action === 'delete') {
      handleDeleteCurrencyItem(item);
    } else if (action === 'edit') {
      setEditCurrency({
        ...item,
        icon: typeof item.icon === 'string' ? item.icon : item.symbol,
      });
    } else {
      updateCurrencyList(item, 'is_base');
    }
  };

  return {
    currencyList,
    showApiProviderStatus,
    lastSyncAt: dataObj?.last_sync_at,
    nextSyncAt: dataObj?.next_sync_at,
    editCurrency,
    setEditCurrency,
    updateData,
    handleToggleCurrencyItem,
    handleDeleteCurrencyItem,
    handleAction,
  };
};
