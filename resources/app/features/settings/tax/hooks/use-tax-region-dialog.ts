import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { CountryWithGroup } from '@/features/settings/tax/lib/helper';
import { groupEUCountries } from '@/features/settings/tax/lib/helper';
import {
  filterAvailableCountries,
  toggleCountrySelection,
  toggleStateSelection,
} from '@/features/settings/tax/lib/tax-region-selection';
import type { SelectedTaxRegionDraft, TaxRegion } from '@/features/settings/tax/lib/utils';
import { type TaxRegionPopupFormInput, TaxRegionPopupFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-popup-form';
import { useCountriesQuery } from '@/services/country';

type CountryStateOption = {
  id: string | number;
  name: string;
  flag?: string;
};

type UseTaxRegionDialogOptions = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  regions: TaxRegion[];
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  setSelectedRegion: (regions: SelectedTaxRegionDraft[]) => void;
  selectedRegion: SelectedTaxRegionDraft[];
  onAdd: () => void;
};

type UseTaxRegionDialogResult = {
  form: UseFormReturn<TaxRegionPopupFormInput>;
  filteredCountries: ReturnType<typeof groupEUCountries>;
  formCountries: string[];
  formRegions: SelectedTaxRegionDraft[];
  buttonState: boolean;
  handleSelectCountries: (country: CountryWithGroup) => void;
  handleSelectStates: (
    stateId: string | number,
    countryCode: string,
    allStates: CountryStateOption[],
    flag?: string,
  ) => void;
  handleSearchRegion: (value: string) => void;
  handleClose: () => void;
  handleSubmit: () => void;
};

export const useTaxRegionDialog = ({
  openPopup,
  setOpenPopup,
  regions,
  selectedCountries,
  setSelectedCountries,
  setSelectedRegion,
  selectedRegion,
  onAdd,
}: UseTaxRegionDialogOptions): UseTaxRegionDialogResult => {
  const [searchValue, setSearchValue] = useState('');
  const [initialObj, setInitialObj] = useState<{
    countries: string[];
    regions: SelectedTaxRegionDraft[];
  }>({ countries: [], regions: [] });
  const { data: countryList } = useCountriesQuery({ limit: -1 });
  const updatedCountryList = groupEUCountries(
    countryList as CountryWithGroup[] | null | undefined,
  );

  const form = useForm<TaxRegionPopupFormInput>({
    resolver: zodResolver(TaxRegionPopupFormSchema),
    defaultValues: {
      selectedCountries,
      selectedRegion,
    },
  });

  const formCountries = form.watch('selectedCountries');
  const formRegions = form.watch('selectedRegion') as SelectedTaxRegionDraft[];

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    setInitialObj({
      countries: [...selectedCountries],
      regions: [...selectedRegion],
    });
    form.reset({
      selectedCountries: [...selectedCountries],
      selectedRegion: [...selectedRegion],
    });
    setSearchValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the form from the current selection only as the dialog opens; tracking the selection would reset the form while the user is picking regions
  }, [openPopup]);

  const syncSelection = (
    nextCountries: string[],
    nextRegions: SelectedTaxRegionDraft[],
  ) => {
    form.setValue('selectedCountries', nextCountries, { shouldDirty: true });
    form.setValue('selectedRegion', nextRegions, { shouldDirty: true });
    setSelectedCountries(nextCountries);
    setSelectedRegion(nextRegions);
  };

  const filteredCountries = useMemo(
    () => filterAvailableCountries(updatedCountryList, searchValue, regions),
    [searchValue, updatedCountryList, regions],
  );

  const handleSelectCountries = (country: CountryWithGroup) => {
    const result = toggleCountrySelection(
      form.getValues('selectedCountries'),
      form.getValues('selectedRegion') as SelectedTaxRegionDraft[],
      country,
    );
    syncSelection(result.countries, result.regions);
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: CountryStateOption[] = [],
    flag?: string,
  ) => {
    const result = toggleStateSelection(
      form.getValues('selectedCountries'),
      form.getValues('selectedRegion') as SelectedTaxRegionDraft[],
      stateId,
      countryCode,
      allStates,
      flag,
    );

    if (!result) {
      return;
    }
    syncSelection(result.countries, result.regions);
  };

  const handleSearchRegion = (value: string) => {
    setSearchValue(value);
  };

  const handleClose = () => {
    setSelectedCountries(initialObj.countries);
    setSelectedRegion(initialObj.regions);
    setOpenPopup(false);
  };

  const handleSubmit = () => {
    onAdd();
  };

  return {
    form,
    filteredCountries,
    formCountries,
    formRegions,
    buttonState: formCountries?.length >= 1,
    handleSelectCountries,
    handleSelectStates,
    handleSearchRegion,
    handleClose,
    handleSubmit,
  };
};
