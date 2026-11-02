import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';

import { getSearchedValue } from '@/features/settings/lib/utils';
import {
  filterUnaddedCurrencies,
  resolveSearchInputValue,
  toggleCurrencySelection,
} from '@/features/settings/multi-currency/lib/currency-selection';
import type {
  CurrencyDraft,
  CurrencyOption,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import {
  type AddCurrencyPopupFormInput,
  type AddCurrencyPopupFormPayload,
  AddCurrencyPopupFormSchema,
} from '@/features/settings/multi-currency/schemas/forms/add-currency-popup-form';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import {
  useAllCurrenciesQuery,
  useAvailableCurrenciesQuery,
} from '@/features/settings/multi-currency/services/currency';

export type AddCurrencyStep = 'select' | 'rates';

export type UseAddCurrencyDialogProps = {
  form: UseFormReturn<AddCurrencyPopupFormInput, unknown, AddCurrencyPopupFormPayload>;
  step: AddCurrencyStep;
  baseCurrencyCode: string;
  handleNext: () => void;
  handleBack: () => void;
  openPopup: boolean;
  setOpenPopup: Dispatch<SetStateAction<boolean>>;
  searchValue: string;
  setSearchValue: Dispatch<SetStateAction<string>>;
  filteredCurrency: CurrencyOption[];
  formSelected: CurrencyDraft[] | undefined;
  handleSelectCurrencies: (currency: CurrencyOption) => void;
  handleSearchCurrency: (event: unknown) => void;
  handleClosePopup: () => void;
  handleSubmit: (values: AddCurrencyPopupFormPayload) => void;
  handleCloseAutoFocus: (event: Event) => void;
};

export const useAddCurrencyDialog = (): UseAddCurrencyDialogProps => {
  const [openPopup, setOpenPopup] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [step, setStep] = useState<AddCurrencyStep>('select');
  const pendingFocusId = useRef<string | null>(null);

  const { data: availableCurrencies } = useAvailableCurrenciesQuery({ limit: -1 });
  const { data: allCurrenciesData } = useAllCurrenciesQuery({}, openPopup);

  const parentForm = useFormContext<MultiCurrencySettingsFormInput>();
  const { append } = useFieldArray({ control: parentForm.control, name: 'currencies' });
  const formCurrencies = useWatch({ control: parentForm.control, name: 'currencies' });

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

  useLayoutEffect(() => {
    if (!openPopup) {
      return;
    }
    form.reset({ selectedCurrencies: [] });
    setSearchValue('');
    setStep('select');
  }, [openPopup, form]);

  const baseCurrencyCode = useMemo(() => {
    return formCurrencies?.find((currency) => currency.is_base)?.code ?? 'USD';
  }, [formCurrencies]);

  const allCurrency = useMemo(() => {
    return filterUnaddedCurrencies(allCurrenciesData ?? [], [
      ...(availableCurrencies ?? []),
      ...(formCurrencies ?? []),
    ]);
  }, [availableCurrencies, allCurrenciesData, formCurrencies]);

  const filteredCurrency = useMemo(() => {
    return getSearchedValue(searchValue, allCurrency);
  }, [searchValue, allCurrency]);

  const handleSelectCurrencies = useCallback(
    (currency: CurrencyOption) => {
      const next = toggleCurrencySelection(formSelected, currency);
      form.setValue('selectedCurrencies', next, { shouldDirty: true });
    },
    [form, formSelected],
  );

  const handleSearchCurrency = (event: unknown) => {
    setSearchValue(resolveSearchInputValue(event));
  };

  const handleNext = () => {
    if (!formSelected?.length) {
      return;
    }
    setStep('rates');
  };

  const handleBack = () => {
    setStep('select');
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleSubmit = (values: AddCurrencyPopupFormPayload) => {
    const firstNewIndex = formCurrencies?.length ?? 0;

    append(values.selectedCurrencies, { shouldFocus: false });
    pendingFocusId.current = `currencies.${firstNewIndex}.exchange_rate`;
    setOpenPopup(false);
  };

  const handleCloseAutoFocus = (event: Event) => {
    const inputId = pendingFocusId.current;
    pendingFocusId.current = null;

    if (!inputId) {
      return;
    }

    // Keep the dialog from returning focus to its trigger; focus the first new rate instead.
    event.preventDefault();
    document.getElementById(inputId)?.focus();
  };

  return {
    form,
    step,
    baseCurrencyCode,
    handleNext,
    handleBack,
    openPopup,
    setOpenPopup,
    searchValue,
    setSearchValue,
    filteredCurrency,
    formSelected,
    handleSelectCurrencies,
    handleSearchCurrency,
    handleClosePopup,
    handleSubmit,
    handleCloseAutoFocus,
  };
};
