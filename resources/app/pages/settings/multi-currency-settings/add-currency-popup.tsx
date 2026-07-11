import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

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
  getAllCurrencyAPI,
  getAvailableCurrenciesAPI,
  setAllCurrencies,
} from '@/store/currenciesSlice';
import { useAppDispatch } from '@/store/hooks';
import type { Currency, PaginatedData } from '@/types';
import { __ } from '@/wpi18n';

import { getSearchedValue } from '../utils';
import ExchangeRatePopup from './exchange-rate-popup';

type AddCurrencyPopupProps = {
  setIsNewCurrencyAdded: Dispatch<SetStateAction<boolean>>;
};

const AddCurrencyPopup = ({ setIsNewCurrencyAdded }: AddCurrencyPopupProps) => {
  const dispatch = useAppDispatch();
  const [openPopup, setOpenPopup] = useState(false);
  const [openExchangePopup, setOpenExchangePopup] = useState(false);
  const [allCurrency, setAllCurrency] = useState<Currency[]>([]);
  const [selectedCurrencyList, setSelectedCurrencyList] = useState<Currency[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [filteredCurrency, setFilteredCurrency] = useState<Currency[]>([]);

  const fetchAllCurrencyList = async () => {
    try {
      const currencyData = await getAvailableCurrenciesAPI();
      const availableCurrencyList =
        (currencyData as PaginatedData<Currency>).results;

      const data = await getAllCurrencyAPI();
      const allCurrencyData = data as Currency[];
      dispatch(setAllCurrencies(allCurrencyData));
      const availableCodes = new Set(
        availableCurrencyList.map((item) => item.code.toLowerCase()),
      );

      const filteredData = allCurrencyData.filter(
        (item) => !availableCodes.has(item.code.toLowerCase()),
      );
      setAllCurrency(filteredData);
    } catch (error) {
      console.error('Failed to load currencies', error);
    }
  };

  useEffect(() => {
    setFilteredCurrency(allCurrency);
  }, [allCurrency]);

  useEffect(() => {
    if (openPopup) {
      fetchAllCurrencyList();
    }
  }, [openPopup]);

  const handleSelectCurrencies = (currency: Currency) => {
    setSelectedCurrencyList((prev) => {
      const exists = prev.some((item) => item.name === currency.name);

      if (exists) {
        return prev.filter((item) => item.name !== currency.name);
      }

      return [...prev, currency];
    });
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
    setOpenPopup(false);
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
                      value={selectedCurrencyList?.some(
                        (c) => c.name === currency.name,
                      )}
                      label={currency.code}
                      onChange={() => handleSelectCurrencies(currency)}
                    />
                    <Flex
                      style={{ justifyContent: 'space-between', width: '100%' }}
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
            state={selectedCurrencyList?.length > 0 ? 'active' : 'disabled'}
            type={'primary'}
            onClick={() => {
              setOpenPopup(false);
              setOpenExchangePopup(true);
            }}
          />
        </PopoverFooter>
      </Popover>
      {openExchangePopup && (
        <ExchangeRatePopup
          selectedCurrencyList={selectedCurrencyList}
          setSelectedCurrencyList={setSelectedCurrencyList}
          isOpen={openExchangePopup}
          setIsOpen={setOpenExchangePopup}
          setAddCurrencyPopup={setOpenPopup}
          setSearchValue={setSearchValue}
          setIsNewCurrencyAdded={setIsNewCurrencyAdded}
        />
      )}
    </>
  );
};

export default AddCurrencyPopup;
