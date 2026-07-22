import { type ComponentProps, type ReactNode, useState } from 'react';
import { useWatch } from 'react-hook-form';

import GroupOptionCard from '@/components/group-option-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { InfoIcon, IncreaseIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { dispatchToastMessage, dateFormatter } from '@/pages/utils';
import type { MultiCurrencySettingsFormValues } from '@/schemas/forms/multi-currency-settings-form';
import {
  useAvailableCurrenciesQuery,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
} from '@/services/currency';
import type {
  Currency,
  CurrencyFormData,
  SelectOption,
} from '@/types';
import { __, sprintf } from '@/wpi18n';

import AddCurrencyPopup from '@/pages/settings/multi-currency-settings/add-currency-dialog';
import EditCurrencyPopup from '@/pages/settings/multi-currency-settings/edit-currency-dialog';

type CurrencyListItem = Currency & {
  badge1?: string;
  is_toggle_disabled?: boolean;
  is_action_disabled?: boolean;
  rightIcon?: ReactNode;
  rightText?: string;
  icon?: ReactNode;
  actionsArray?: SelectOption[];
};

const getActionArray = (item: Currency): SelectOption[] => {
  if (item?.is_base) {
    return [];
  }
  return [
    {
      title: __('Edit', 'kirki-ecommerce'),
      value: 'edit',
    },
    {
      title: __('Delete', 'kirki-ecommerce'),
      value: 'delete',
    },
    {
      title: __('Set as base currency', 'kirki-ecommerce'),
      value: 'set_base',
    },
  ];
};

export const AvailableCurrencyList = () => {
  const [editCurrency, setEditCurrency] = useState<(Currency & { icon?: string }) | null>(null);
  const dataObj = useWatch<MultiCurrencySettingsFormValues>();

  const { data: rawCurrencies = [], refetch } = useAvailableCurrenciesQuery();
  const { mutate: updateCurrencyMutate } = useUpdateCurrencyMutation();
  const { mutate: deleteCurrencyMutate } = useDeleteCurrencyMutation();

  const showApiProviderStatus =
    dataObj?.is_automatic_update_enabled === true &&
    dataObj?.api_provider &&
    dataObj?.last_sync_at &&
    dataObj?.next_sync_at;

  const currencyList: CurrencyListItem[] = (rawCurrencies as Currency[]).map(
    (item) => ({
      ...item,
      ...(item?.is_base && {
        badge1: __('Base Currency', 'kirki-ecommerce'),
        is_toggle_disabled: true,
        is_action_disabled: true,
      }),
      is_enabled: item?.is_active,
      rightIcon: <IncreaseIcon />,
      rightText:
        item?.exchange_rate != null ? String(item.exchange_rate) : undefined,
      icon: item?.symbol,
      actionsArray: getActionArray(item),
    }),
  );

  const updateData = (payload: CurrencyFormData) => {
    updateCurrencyMutate(payload, {
      onSuccess: () => refetch(),
    });
  };

  const updateCurrencyList = (item: CurrencyListItem, key: keyof Currency) => {
    if (key !== 'is_base') {
      const selectedCurrency = currencyList?.find(
        (currency) => currency?.id === item?.id,
      );
      if (!selectedCurrency) {
        return;
      }

      const payload: CurrencyFormData = {
        items: [
          {
            ...selectedCurrency,
            [key]: !selectedCurrency[key],
          },
        ],
      };

      updateData(payload);
      return;
    }

    const payload: CurrencyFormData = {
      items: currencyList?.map((currency) => ({
        ...currency,
        is_base: currency?.id === item?.id,
      })),
    };
    updateData(payload);
  };

  const handleToggleCurrencyItem = (item: CurrencyListItem) => {
    updateCurrencyList(item, 'is_active');
  };

  const handleDeleteCurrencyItem = (item: CurrencyListItem) => {
    dispatchToastMessage('delete', {
      title: __('Currency deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => refetch(),
      onSuccess: async () => {
        deleteCurrencyMutate(item.id as number, {
          onSuccess: () => refetch(),
        });
      },
    });
  };

  const handleAction = (
    action: string | number | Array<string | number>,
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

  return (
    <>
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
        style={{
          padding: 'var(--decom-spacing-5)',
        }}
      >
        <Flex
          style={{
            justifyContent: 'space-between',
            paddingBottom: 'var(--decom-spacing-3)',
          }}
        >
          <Text header={__('Available Currencies', 'kirki-ecommerce')} type="primary" />
          <AddCurrencyPopup />
        </Flex>
        <GroupOptionCard
          dataArr={
            currencyList as ComponentProps<typeof GroupOptionCard>['dataArr']
          }
          handleToggleItem={(item) => handleToggleCurrencyItem(item as CurrencyListItem)}
          handleMoreOption={true}
          actionsArray={[]}
          handleAction={(action, item) => handleAction(action, item as CurrencyListItem)}
        />
        <Flex
          gap={8}
          style={{
            paddingTop: 'var(--decom-spacing-2)',
          }}
        >
          <InfoIcon />
          <Text
            type="xsm"
            subHeader={
              showApiProviderStatus
                ? sprintf(
                    __(
                      'API connection is active. Last sync: %s. Next update %s.',
                      'kirki-ecommerce',
                    ),
                    dateFormatter(dataObj?.last_sync_at as string, 'relative'),
                    dateFormatter(dataObj?.next_sync_at as string, 'relative'),
                  )
                : __('API connection is inactive', 'kirki-ecommerce')
            }
          />
        </Flex>
      </Card>
      {editCurrency && (
        <EditCurrencyPopup
          editCurrency={editCurrency}
          setEditCurrency={setEditCurrency}
          handleUpdateData={(currency) => updateData({ items: [currency] })}
        />
      )}
    </>
  );
};
