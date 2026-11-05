import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';

import { getSearchedValue } from '@/features/settings/lib/utils';
import {
  filterUnaddedCurrencies,
  resolveSearchInputValue,
  selectBaseCurrency,
  toggleCurrencySelection,
} from '@/features/settings/multi-currency/lib/currency-selection';
import type {
  CurrencyDraft,
  CurrencyOption,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import type {
  AddCurrencyPopupFormInput,
  AddCurrencyPopupFormPayload,
} from '@/features/settings/multi-currency/schemas/forms/add-currency-popup-form';
import { AddCurrencyPopupFormSchema } from '@/features/settings/multi-currency/schemas/forms/add-currency-popup-form';
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
  isSelectingBaseCurrency?: boolean;
};

const AddCurrencyDialogContext = createContext<UseAddCurrencyDialogProps | null>(null);

type AddCurrencyDialogProviderProps = {
  children: ReactNode;
  isSelectingBaseCurrency?: boolean;
  onSave: () => void;
};

const AddCurrencyDialogProvider = ({
  children,
  isSelectingBaseCurrency = false,
  onSave,
}: AddCurrencyDialogProviderProps) => {
  const [openPopup, setOpenPopup] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [step, setStep] = useState<AddCurrencyStep>('select');

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
    return formCurrencies?.find((currency) => currency.is_base)?.code ?? '';
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
      const select = isSelectingBaseCurrency ? selectBaseCurrency : toggleCurrencySelection;
      form.setValue('selectedCurrencies', select(formSelected, currency), { shouldDirty: true });
    },
    [form, formSelected, isSelectingBaseCurrency],
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
    append(values.selectedCurrencies, { shouldFocus: false });
    onSave();
    setOpenPopup(false);
  };

  const value = {
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
    isSelectingBaseCurrency,
  };

  return (
    <AddCurrencyDialogContext.Provider value={value}>{children}</AddCurrencyDialogContext.Provider>
  );
};

AddCurrencyDialogProvider.displayName = 'AddCurrencyDialogProvider';

export { AddCurrencyDialogContext, AddCurrencyDialogProvider };
