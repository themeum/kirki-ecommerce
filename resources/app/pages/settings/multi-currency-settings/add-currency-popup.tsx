import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { PlusIcon, SearchIcon } from '@/icons';
import Button from '@/molecules/button';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  AddCurrencyPopupFormSchema,
  type AddCurrencyPopupFormValues,
} from '@/schemas/forms/add-currency-popup-form';
import {
  useAllCurrenciesQuery,
  useAvailableCurrenciesQuery,
} from '@/services/currency';
import type { Currency } from '@/types';
import { __ } from '@/wpi18n';

import { getSearchedValue } from '@/pages/settings/utils';
import ExchangeRatePopup from '@/pages/settings/multi-currency-settings/exchange-rate-popup';

const AddCurrencyPopup = () => {
  const [openPopup, setOpenPopup] = useState(false);
  const [openExchangePopup, setOpenExchangePopup] = useState(false);
  const [allCurrency, setAllCurrency] = useState<Currency[]>([]);
  const [selectedCurrencyList, setSelectedCurrencyList] = useState<Currency[]>(
    [],
  );
  const [searchValue, setSearchValue] = useState('');
  const [filteredCurrency, setFilteredCurrency] = useState<Currency[]>([]);

  const { data: availableCurrencies = [] } = useAvailableCurrenciesQuery({
    limit: -1,
  });
  const { data: allCurrenciesData = [] } = useAllCurrenciesQuery();

  const form = useForm<AddCurrencyPopupFormValues>({
    resolver: zodResolver(AddCurrencyPopupFormSchema),
    defaultValues: {
      selectedCurrencies: [],
    },
  });

  const formSelected = form.watch('selectedCurrencies') as Currency[];

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    const availableCodes = new Set(
      availableCurrencies.map((item) => item.code.toLowerCase()),
    );

    const filteredData = allCurrenciesData.filter(
      (item) => !availableCodes.has(item.code.toLowerCase()),
    );
    setAllCurrency(filteredData);
    form.reset({ selectedCurrencies: [] });
    setSearchValue('');
  }, [openPopup, availableCurrencies, allCurrenciesData, form]);

  useEffect(() => {
    setFilteredCurrency(allCurrency);
  }, [allCurrency]);

  const handleSelectCurrencies = (currency: Currency) => {
    const current = form.getValues('selectedCurrencies') as Currency[];
    const exists = current.some((item) => item.name === currency.name);
    const next = exists
      ? current.filter((item) => item.name !== currency.name)
      : [...current, currency];
    form.setValue('selectedCurrencies', next, { shouldDirty: true });
  };

  const handleSearchCurrency = (e: unknown) => {
    const eventValue =
      typeof e === 'object' && e !== null && 'target' in e
        ? (e as { target?: { value?: string } })?.target?.value
        : e;
    const value = String(eventValue ?? '');
    setSearchValue(value);

    if (!value) {
      setFilteredCurrency(allCurrency);
      return;
    }
    const result = getSearchedValue(value, allCurrency) as Currency[];
    setFilteredCurrency(result);
  };

  const handleClosePopup = () => {
    setSearchValue('');
    setSelectedCurrencyList([]);
    form.reset({ selectedCurrencies: [] });
    setOpenPopup(false);
  };

  const handleSubmit = (values: AddCurrencyPopupFormValues) => {
    setSelectedCurrencyList(values.selectedCurrencies as Currency[]);
    setOpenPopup(false);
    setOpenExchangePopup(true);
  };

  return (
    <>
      <Button
        text={__('Add Currency', 'kirki-ecommerce')}
        size="small"
        type="secondary"
        leftIcon={<PlusIcon />}
        onClick={() => setOpenPopup(true)}
      />
      <Popover isOpen={openPopup} style={{ width: '442px' }}>
        <PopoverHeader borderBottom onClose={() => handleClosePopup()}>
          {__('Select Additional Currencies', 'kirki-ecommerce')}
        </PopoverHeader>
        <Form {...form}>
          <PopoverBody
            style={{
              padding: 'var(--decom-spacing-3) var(--decom-spacing-5)',
            }}
          >
            <Flex direction="column" gap={16}>
              <Input
                label={__('Search currency', 'kirki-ecommerce')}
                type="search"
                leftIcon={<SearchIcon />}
                value={searchValue}
                placeholder={__('e.g United States', 'kirki-ecommerce')}
                onChange={(e) => handleSearchCurrency(e)}
              />

              <Flex
                direction="column"
                gap={12}
                style={{
                  height: '200px',
                  overflowX: 'scroll',
                }}
              >
                {filteredCurrency?.length > 0 &&
                  filteredCurrency.map((currency, index) => (
                    <Flex
                      key={index}
                      gap={12}
                      onClick={() => handleSelectCurrencies(currency)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Checkbox
                        value={formSelected?.some(
                          (c) => c.name === currency.name,
                        )}
                        label={currency.code}
                        onChange={() => handleSelectCurrencies(currency)}
                      />
                      <Flex
                        style={{
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Text
                          type="xsm"
                          header={currency.name}
                          style={{ color: 'var(--decom-text-text-subdued)' }}
                        />
                        <Text
                          style={{ paddingRight: 'var(--decom-spacing-3)' }}
                          type="primary"
                          header={currency.symbol}
                        />
                      </Flex>
                    </Flex>
                  ))}
              </Flex>
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type={'outlined'}
              onClick={() => handleClosePopup()}
            />
            <Button
              text={__('Next', 'kirki-ecommerce')}
              state={formSelected?.length > 0 ? 'active' : 'disabled'}
              type={'primary'}
              onClick={form.handleSubmit(handleSubmit)}
            />
          </PopoverFooter>
        </Form>
      </Popover>
      {openExchangePopup && (
        <ExchangeRatePopup
          selectedCurrencyList={selectedCurrencyList}
          setSelectedCurrencyList={setSelectedCurrencyList}
          isOpen={openExchangePopup}
          setIsOpen={setOpenExchangePopup}
          setAddCurrencyPopup={setOpenPopup}
          setSearchValue={setSearchValue}
        />
      )}
    </>
  );
};

AddCurrencyPopup.displayName = 'AddCurrencyPopup';

export default AddCurrencyPopup;
