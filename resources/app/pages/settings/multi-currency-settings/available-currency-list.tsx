import { type ReactNode, useState } from 'react';
import { useWatch } from 'react-hook-form';

import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIcon, IncreaseIcon, ShowMoreIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
  useStackedItem,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { dispatchToastMessage, dateFormatter } from '@/pages/utils';
import type { MultiCurrencySettingsFormInput } from '@/schemas/forms/multi-currency-settings-form';
import { useAvailableCurrenciesQuery, useUpdateCurrencyMutation, useDeleteCurrencyMutation } from '@/services/currency';
import type {
  Currency,
  CurrencyFormData,
  SelectOption,
} from '@/types';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
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

type CurrencyRowActionsProps = {
  item: CurrencyListItem;
  onToggle: (item: CurrencyListItem) => void;
  onAction: (
    action: string | number | Array<string | number>,
    item: CurrencyListItem,
  ) => void;
};

const CurrencyRowActions = (props: CurrencyRowActionsProps) => {
  const { item, onToggle, onAction } = props;
  const { setOpen } = useStackedItem();

  return (
    <ActionGroup>
      {!item.is_toggle_disabled && (
        <Switch
          checked={Boolean(item.is_enabled)}
          onCheckedChange={() => onToggle(item)}
        />
      )}
      {!item.is_action_disabled && (
        <DropdownButton
          buttonProps={{
            type: 'secondary',
            style: { transform: 'rotate(90deg)' },
            icon: <ShowMoreIcon />,
            cssOverride: styles.actionButton,
          }}
          dropdownStyle={{ minWidth: '170px' }}
          size="small"
          hasLeftIcon={false}
          options={item.actionsArray || []}
          onOptionToggle={(value) => setOpen(value === true)}
          onOptionSelect={(action) => onAction(action, item)}
        />
      )}
    </ActionGroup>
  );
};

export const AvailableCurrencyList = () => {
  const [editCurrency, setEditCurrency] = useState<(Currency & { icon?: string }) | null>(null);
  const dataObj = useWatch<MultiCurrencySettingsFormInput>();

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
      <Card cssOverride={cardStyles.innerCard}>
        <CardContent cssOverride={styles.innerCardContent}>
          <Flex justify="space-between" cssOverride={{ paddingBottom: theme.spacing[3] }}>
            <Text weight="semibold">{__('Available Currencies', 'kirki-ecommerce')}</Text>
            <AddCurrencyPopup />
          </Flex>
          <StackedItems>
            {currencyList.map((item) => (
              <StackedItem key={item.id} id={String(item.id)}>
                {item.icon && <StackedItemMedia>{item.icon}</StackedItemMedia>}
                <StackedItemContent>
                  <StackedItemTitle>
                    <Text variant="small" weight="medium">
                      {item.name}
                    </Text>
                    {item.is_base && (
                      <Badge variant="secondary">
                        {__('Base currency', 'kirki-ecommerce')}
                      </Badge>
                    )}
                    {item.is_enabled === false && (
                      <Badge variant="destructive">
                        {__('Inactive', 'kirki-ecommerce')}
                      </Badge>
                    )}
                  </StackedItemTitle>
                </StackedItemContent>
                <StackedItemActions>
                  <CurrencyRowActions
                    item={item}
                    onToggle={handleToggleCurrencyItem}
                    onAction={handleAction}
                  />
                </StackedItemActions>
              </StackedItem>
            ))}
          </StackedItems>
          <Flex gap={2} cssOverride={{ paddingTop: theme.spacing[2] }}>
            <InfoIcon />
            <Text variant="small" color="subdued">{showApiProviderStatus
                  ? sprintf(
                      __(
                        'API connection is active. Last sync: %s. Next update %s.',
                        'kirki-ecommerce',
                      ),
                      dateFormatter(dataObj?.last_sync_at as string, 'relative'),
                      dateFormatter(dataObj?.next_sync_at as string, 'relative'),
                    )
                  : __('API connection is inactive', 'kirki-ecommerce')}</Text>
          </Flex>
        </CardContent>
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

const styles = defineStyles({
  innerCardContent: {
    padding: theme.spacing[5],
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
