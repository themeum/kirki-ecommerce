import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { PlusIcon, SearchIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  AddCurrencyPopupFormSchema,
  type AddCurrencyPopupFormValues,
} from '@/schemas/forms/add-currency-popup-form';
import {
  useAllCurrenciesQuery,
  useAvailableCurrenciesQuery,
} from '@/services/currency';
import type { Currency } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { getSearchedValue } from '@/pages/settings/utils';
import ExchangeRatePopup from '@/pages/settings/multi-currency-settings/exchange-rate-dialog';

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
      <Button variant="secondary" size="sm" onClick={() => setOpenPopup(true)}>
        <PlusIcon />
        {__('Add Currency', 'kirki-ecommerce')}
      </Button>
      <Dialog
        open={openPopup}
        onOpenChange={(next) => {
          if (!next) {
            handleClosePopup();
          }
        }}
      >
        <DialogContent>
          <DialogCloseButton />
          <DialogHeader>
            <DialogTitle>
              {__('Select Additional Currencies', 'kirki-ecommerce')}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogBody>
                <Flex direction="column" gap={16}>
                  <div>
                    <Label htmlFor="add-currency-search">
                      {__('Search currency', 'kirki-ecommerce')}
                    </Label>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: theme.spacing[3],
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      >
                        <SearchIcon />
                      </span>
                      <Input
                        id="add-currency-search"
                        type="search"
                        value={searchValue}
                        placeholder={__(
                          'e.g United States',
                          'kirki-ecommerce',
                        )}
                        onChange={(e) => handleSearchCurrency(e)}
                        css={styles.searchInput}
                      />
                    </div>
                  </div>

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
                          <Flex gap={8} style={{ alignItems: 'center' }}>
                            <Checkbox
                              id={`add-currency-checkbox-${index}`}
                              checked={formSelected?.some(
                                (c) => c.name === currency.name,
                              )}
                              onCheckedChange={() =>
                                handleSelectCurrencies(currency)
                              }
                            />
                            <Label
                              htmlFor={`add-currency-checkbox-${index}`}
                            >
                              {currency.code}
                            </Label>
                          </Flex>
                          <Flex
                            style={{
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Text
                              type="xsm"
                              header={currency.name}
                              style={{
                                color: theme.colors.text.subdued,
                              }}
                            />
                            <Text
                              css={styles.symbolText}
                              type="primary"
                              header={currency.symbol}
                            />
                          </Flex>
                        </Flex>
                      ))}
                  </Flex>
                </Flex>
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formSelected || formSelected.length === 0}
                >
                  {__('Next', 'kirki-ecommerce')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
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

const styles = {
  searchInput: scoped({
    paddingLeft: theme.spacing[8],
  }),
  symbolText: scoped({
    paddingRight: theme.spacing[3],
  }),
};
