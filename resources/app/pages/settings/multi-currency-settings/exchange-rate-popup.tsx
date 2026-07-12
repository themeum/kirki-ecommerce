import { useState, type Dispatch, type SetStateAction } from 'react';

import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon, InfoIcon } from '@/icons';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import { createNewCurrencyAPI } from '@/store/currenciesSlice';
import { useAppSelector } from '@/store/hooks';
import { getErrorsObject } from '@/store/utils';
import type { Currency, CurrencyFormData, FormErrors } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __, sprintf } from '@/wpi18n';

import { dispatchToastMessage } from '@/pages/utils';

type ExchangeRatePopupProps = {
  selectedCurrencyList?: Currency[];
  setSelectedCurrencyList: Dispatch<SetStateAction<Currency[]>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setAddCurrencyPopup: Dispatch<SetStateAction<boolean>>;
  setIsNewCurrencyAdded: Dispatch<SetStateAction<boolean>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
};

const ExchangeRatePopup = ({
  selectedCurrencyList = [],
  setSelectedCurrencyList,
  isOpen,
  setIsOpen,
  setAddCurrencyPopup,
  setIsNewCurrencyAdded,
  setSearchValue,
}: ExchangeRatePopupProps) => {
  const [currencies, setCurrencies] = useState<Currency[]>(selectedCurrencyList || []);
  const [errors, setErrors] = useState<FormErrors>({});

  const availableCurrencyList = useAppSelector(
    (state) => state.currencies?.data?.available,
  );

  const handleOnChange = (value: unknown, currency: Currency, index: number) => {
    setCurrencies((prev = []) =>
      prev.map((item) =>
        item?.code.toLowerCase() === currency?.code.toLowerCase()
          ? { ...item, exchange_rate: value as string | number, is_base: false, is_active: true }
          : item,
      ),
    );
    setErrors((prev) => ({
      ...prev,
      [`items.${index}.exchange_rate`]: null,
    }));
  };

  const handleSaveCurrencyData = async () => {
    const payload: CurrencyFormData = {
      items: currencies.map((item, idx) => ({
        ...item,
        is_base:
          availableCurrencyList?.length === 0 && idx === 0
            ? true
            : item?.is_base,
      })),
    };

    const result = await createNewCurrencyAPI(payload);

    if (isApiSuccess(result)) {
      dispatchToastMessage('success', { title: 'New currency added' });
      setIsOpen(false);
      setSelectedCurrencyList([]);
      setSearchValue('');
      setIsNewCurrencyAdded(true);
    } else {
      const errorPayload = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorPayload.errors));
    }
  };

  const handleClosePopup = () => {
    setSelectedCurrencyList([]);
    setIsOpen(false);
  };

  return (
    <>
      <Popover isOpen={isOpen} style={{ width: '442px' }}>
        <PopoverHeader
          leftIcon={<ArrowLeftIcon />}
          onClose={() => handleClosePopup()}
          style={{ gap: 'var(--decom-spacing-1)' }}
          borderBottom
        >
          {__('Set Exchange Rates', 'kirki-ecommerce')}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: 'var(--decom-spacing-5)',
            gap: 'var(--decom-spacing-4)',
          }}
        >
          <Label
            className={`${CLASS_PREFIX}-edit-currency-rate-popup-label`}
            text={__('Enter rates per 1 USD', 'kirki-ecommerce')}
            leftIcon={<InfoIcon />}
          />
          <Flex
            direction="column"
            gap={16}
            style={{
              maxHeight: '200px',
              overflowX: 'scroll',
            }}
          >
            {selectedCurrencyList?.length > 0 &&
              selectedCurrencyList?.map((currency, index) => (
                <Flex key={index} style={{ justifyContent: 'space-between' }}>
                  <Flex gap={12}>
                    <Text
                      type="primary"
                      header={sprintf(__('%s', 'kirki-ecommerce'), currency?.symbol ?? '')}
                    />
                    <Text
                      type="secondary"
                      header={sprintf(__('%s', 'kirki-ecommerce'), currency?.code ?? '')}
                    />
                    <Text
                      type="xsm"
                      style={{ color: 'var(--decom-text-text-subdued)' }}
                      header={sprintf(__('%s', 'kirki-ecommerce'), currency?.name ?? '')}
                    />
                  </Flex>
                  <div
                    style={{
                      width: 'auto',
                      margin: 'var(--decom-spacing-f1)',
                    }}
                  >
                    <Input
                      placeholder={__('0.730', 'kirki-ecommerce')}
                      style={{ width: 'auto' }}
                      onChange={(value) =>
                        handleOnChange(value, currency, index)
                      }
                      error={errors[`items.${index}.exchange_rate`] as string | boolean | undefined}
                    />
                  </div>
                </Flex>
              ))}
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__('Cancel', 'kirki-ecommerce')}
            type={'outlined'}
            onClick={() => {
              setIsOpen(false);
              setAddCurrencyPopup(true);
            }}
          />
          <Button
            text={__('Save', 'kirki-ecommerce')}
            type={'primary'}
            onClick={handleSaveCurrencyData}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default ExchangeRatePopup;
