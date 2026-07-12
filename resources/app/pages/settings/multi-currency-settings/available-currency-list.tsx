import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import { InfoIcon, IncreaseIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import {
  deleteCurrencyDataByIdAPI,
  getAvailableCurrenciesAPI,
  setAvailableCurrencies,
  updateCurrencyData,
} from '@/store/currenciesSlice';
import { useAppDispatch } from '@/store/hooks';
import type {
  Currency,
  CurrencyFormData,
  PaginatedData,
  SelectOption,
  SettingsSectionData,
} from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __, sprintf } from '@/wpi18n';

import { dateFormatter, dispatchToastMessage } from '@/pages/utils';
import AddCurrencyPopup from '@/pages/settings/multi-currency-settings/add-currency-popup';
import EditCurrencyPopup from '@/pages/settings/multi-currency-settings/edit-currency-popup';

type CurrencyListItem = Currency & {
  badge1?: string;
  is_toggle_disabled?: boolean;
  is_action_disabled?: boolean;
  rightIcon?: ReactNode;
  rightText?: string;
  icon?: ReactNode;
  actionsArray?: SelectOption[];
};

type AvailableCurrencyListProps = {
  dataObj: SettingsSectionData & {
    last_sync_at?: string | null;
    next_sync_at?: string | null;
  };
};

export const AvailableCurrencyList = ({ dataObj }: AvailableCurrencyListProps) => {
  const dispatch = useAppDispatch();
  const [currencyList, setCurrencyList] = useState<CurrencyListItem[]>([]);
  const [isNewCurrencyAdded, setIsNewCurrencyAdded] = useState(false);
  const [editCurrency, setEditCurrency] = useState<(Currency & { icon?: string }) | null>(null);

  const showApiProviderStatus =
    dataObj?.is_automatic_update_enabled === true &&
    dataObj?.api_provider &&
    dataObj?.last_sync_at &&
    dataObj?.next_sync_at;

  const fetchCurrencies = async () => {
    try {
      const data = await getAvailableCurrenciesAPI();
      const currencyListData = (data as PaginatedData<Currency>)?.results;

      dispatch(setAvailableCurrencies(currencyListData));
      const formattedCurrencies = currencyListData?.map((item) => ({
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
      }));

      setCurrencyList(formattedCurrencies ?? []);
    } catch (error) {
      console.error('Failed to load currencies', error);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    setIsNewCurrencyAdded(false);
  }, [isNewCurrencyAdded]);

  const updateCurrencyList = async (item: CurrencyListItem, key: keyof Currency) => {
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

      await updateData(payload);
      return;
    }

    const payload: CurrencyFormData = {
      items: currencyList?.map((currency) => ({
        ...currency,
        is_base: currency?.id === item?.id,
      })),
    };
    await updateData(payload);
  };

  const updateData = async (payload: CurrencyFormData) => {
    const result = await updateCurrencyData(payload);
    if (!isApiSuccess(result)) {
      return;
    }
    dispatchToastMessage('success', {
      title: __('Currency value updated', 'kirki-ecommerce'),
    });

    fetchCurrencies();
  };

  const handleToggleCurrencyItem = async (item: CurrencyListItem) => {
    await updateCurrencyList(item, 'is_active');
  };

  const handleDeleteCurrencyItem = async (item: CurrencyListItem) => {
    const initialList = [...currencyList];

    const updatedCurrencyList = currencyList?.filter(
      (currency) => currency?.id !== item?.id,
    );
    setCurrencyList(updatedCurrencyList);

    dispatchToastMessage('delete', {
      title: __('Currency deleted', 'kirki-ecommerce'),
      duration: 5000,
      undoAction: () => {
        setCurrencyList(initialList);
      },
      onSuccess: async () => {
        await deleteCurrencyDataByIdAPI(item.id);
        fetchCurrencies();
      },
    });
  };

  const handleAction = async (
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
      await updateCurrencyList(item, 'is_base');
    }
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

  return (
    <>
      <Card
        type="inner"
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
          <AddCurrencyPopup setIsNewCurrencyAdded={setIsNewCurrencyAdded} />
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
          handleUpdateData={updateData}
        />
      )}
    </>
  );
};
