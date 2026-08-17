import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';

import { getSearchedValue } from '@/features/settings/lib/utils';
import { filterUnaddedCurrencies, resolveSearchInputValue, toggleCurrencySelection } from '@/features/settings/multi-currency/lib/currency-selection';
import type { CurrencyDraft, CurrencyOption } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { type AddCurrencyPopupFormInput, type AddCurrencyPopupFormPayload, AddCurrencyPopupFormSchema } from '@/features/settings/multi-currency/schemas/forms/add-currency-popup-form';
import { useAllCurrenciesQuery, useAvailableCurrenciesQuery } from '@/features/settings/multi-currency/services/currency';

type UseAddCurrencyDialogResult = {
  form: UseFormReturn<AddCurrencyPopupFormInput, unknown, AddCurrencyPopupFormPayload>;
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  openExchangePopup: boolean;
  setOpenExchangePopup: Dispatch<SetStateAction<boolean>>;
  selectedCurrencyList: CurrencyDraft[];
  setSelectedCurrencyList: Dispatch<SetStateAction<CurrencyDraft[]>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  filteredCurrency: CurrencyOption[];
  formSelected: CurrencyDraft[] | undefined;
  handleSelectCurrencies: (currency: CurrencyOption) => void;
  handleSearchCurrency: (event: unknown) => void;
  handleClosePopup: () => void;
  handleSubmit: (values: AddCurrencyPopupFormPayload) => void;
};

export const useAddCurrencyDialog = (): UseAddCurrencyDialogResult => {
  const [openPopup, setOpenPopup] = useState(false);
  const [openExchangePopup, setOpenExchangePopup] = useState(false);
  const [allCurrency, setAllCurrency] = useState<CurrencyOption[]>([]);
  const [selectedCurrencyList, setSelectedCurrencyList] = useState<CurrencyDraft[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [filteredCurrency, setFilteredCurrency] = useState<CurrencyOption[]>([]);

  const { data: availableCurrencies = [] } = useAvailableCurrenciesQuery({ limit: -1 });
  const { data: allCurrenciesData = [] } = useAllCurrenciesQuery();

  const form = useForm<AddCurrencyPopupFormInput, unknown, AddCurrencyPopupFormPayload>({
    resolver: zodResolver(AddCurrencyPopupFormSchema),
    defaultValues: {
      selectedCurrencies: [],
    },
  });

  const formSelected = useWatch({
    control: form.control,
    name: 'selectedCurrencies',
  });

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    setAllCurrency(filterUnaddedCurrencies(allCurrenciesData, availableCurrencies));
    form.reset({ selectedCurrencies: [] });
    setSearchValue('');
  }, [openPopup, availableCurrencies, allCurrenciesData, form]);

  useEffect(() => {
    setFilteredCurrency(allCurrency);
  }, [allCurrency]);

  const handleSelectCurrencies = (currency: CurrencyOption) => {
    const next = toggleCurrencySelection(form.getValues('selectedCurrencies'), currency);
    form.setValue('selectedCurrencies', next, { shouldDirty: true });
  };

  const handleSearchCurrency = (event: unknown) => {
    const value = resolveSearchInputValue(event);
    setSearchValue(value);

    if (!value) {
      setFilteredCurrency(allCurrency);
      return;
    }
    setFilteredCurrency(getSearchedValue(value, allCurrency));
  };

  const handleClosePopup = () => {
    setSearchValue('');
    setSelectedCurrencyList([]);
    form.reset({ selectedCurrencies: [] });
    setOpenPopup(false);
  };

  const handleSubmit = (values: AddCurrencyPopupFormPayload) => {
    setSelectedCurrencyList(values.selectedCurrencies);
    setOpenPopup(false);
    setOpenExchangePopup(true);
  };

  return {
    form,
    openPopup,
    setOpenPopup,
    openExchangePopup,
    setOpenExchangePopup,
    selectedCurrencyList,
    setSelectedCurrencyList,
    searchValue,
    setSearchValue,
    filteredCurrency,
    formSelected,
    handleSelectCurrencies,
    handleSearchCurrency,
    handleClosePopup,
    handleSubmit,
  };
};
