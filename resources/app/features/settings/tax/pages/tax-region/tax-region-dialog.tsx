import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { getSearchedCountries } from '@/features/settings/lib/utils';
import type { CountryWithGroup } from '@/features/settings/tax/lib/helper';
import { groupEUCountries } from '@/features/settings/tax/lib/helper';
import type {
  SelectedTaxRegionDraft,
  TaxRegion,
} from '@/features/settings/tax/lib/utils';
import { type TaxRegionPopupFormInput, TaxRegionPopupFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-popup-form';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors } from '@/types/pages/common';
import { noop } from '@/utils/function';
import { __, sprintf } from '@/wpi18n';

type TaxRegionPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  regions: TaxRegion[];
  selectedCountries?: string[];
  setSelectedCountries?: Dispatch<SetStateAction<string[]>>;
  setSelectedRegion?: Dispatch<SetStateAction<SelectedTaxRegionDraft[]>>;
  selectedRegion?: SelectedTaxRegionDraft[];
  onAdd?: () => void;
  errors?: FormErrors;
};

type InitialPopupState = {
  countries: string[];
  regions: SelectedTaxRegionDraft[];
};

type CountryStateOption = {
  id: string | number;
  name: string;
  flag?: string;
};

const TaxRegionPopup = (props: TaxRegionPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    regions,
    selectedCountries = [],
    setSelectedCountries = noop,
    setSelectedRegion = noop,
    selectedRegion = [],
    onAdd = noop,
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const [initialObj, setInitialObj] = useState<InitialPopupState>({
    countries: [],
    regions: [],
  });
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
  const formRegions = form.watch(
    'selectedRegion',
  ) as SelectedTaxRegionDraft[];

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

  const filteredCountries = useMemo(() => {
    if (!updatedCountryList?.length) {
      return [];
    }

    const searched = searchValue?.trim()
      ? getSearchedCountries(searchValue, updatedCountryList)
      : updatedCountryList;

    return searched.filter(
      (country) => !regions.some((r) => r.code === country.code),
    );
  }, [searchValue, updatedCountryList, regions]);

  const handleSelectCountries = (country: CountryWithGroup) => {
    const prevCountries = form.getValues('selectedCountries');
    const prevRegions = form.getValues(
      'selectedRegion',
    ) as SelectedTaxRegionDraft[];
    const isSelected = prevCountries.includes(country.code);

    const nextCountries = isSelected
      ? prevCountries.filter((c) => c !== country.code)
      : [...prevCountries, country.code];

    let nextRegions: SelectedTaxRegionDraft[];
    const exists = prevRegions.find((r) => r.country === country.name);

    if (exists) {
      nextRegions = prevRegions.filter((r) => r.country !== country.name);
    } else {
      const states = (country.states ?? []) as CountryStateOption[];
      nextRegions = [
        ...prevRegions,
        {
          id: country.code,
          country: country.name,
          states: states.map((s) => ({
            id: s.id,
            title: String(s.name),
            flag: s.flag || '',
          })),
          hasDeselectedState: false,
          flag: country.flag || '',
        },
      ];
    }

    syncSelection(nextCountries, nextRegions);
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: CountryStateOption[] = [],
    flag?: string,
  ) => {
    const prevCountries = form.getValues('selectedCountries');
    const prevRegions = form.getValues(
      'selectedRegion',
    ) as SelectedTaxRegionDraft[];
    const countryIndex = prevRegions.findIndex((item) => item.id === countryCode);

    if (countryIndex === -1) {
      return;
    }

    const countryItem = prevRegions[countryIndex];
    const stateExists = countryItem.states.some((s) => s.id === stateId);

    let updatedStates: SelectedTaxRegionDraft['states'];
    if (stateExists) {
      updatedStates = countryItem.states.filter((s) => s.id !== stateId);
    } else {
      updatedStates = [
        ...countryItem.states,
        {
          id: stateId,
          title: String(
            allStates.find((s) => s.id === stateId)?.name || stateId,
          ),
          flag: flag || '',
        },
      ];
    }

    if (updatedStates.length === 0) {
      syncSelection(
        prevCountries.filter((c) => c !== countryCode),
        prevRegions.filter((_, i) => i !== countryIndex),
      );
      return;
    }

    const hasDeselectedState = updatedStates.length !== allStates.length;
    const nextRegions = prevRegions.map((item, index) =>
      index === countryIndex
        ? { ...item, states: updatedStates, hasDeselectedState }
        : item,
    );
    syncSelection(prevCountries, nextRegions);
  };

  const handleSearchRegion = (value: string) => {
    setSearchValue(value);
  };

  const handleClose = () => {
    setSelectedCountries(initialObj?.countries);
    setSelectedRegion(initialObj?.regions);
    setOpenPopup(false);
  };

  const buttonState = formCountries?.length >= 1;

  const handleSubmit = () => {
    onAdd();
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenPopup(false);
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Add tax region', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="tax-region-search">
                {__('Select countries', 'kirki-ecommerce')}
              </Label>
              <Input
                id="tax-region-search"
                type="search"
                placeholder="Cities"
                onChange={(e) => handleSearchRegion(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.lightCard}>
              <div
                style={{
                  height: '350px',
                  overflowX: 'hidden',
                  overflowY: 'scroll',
                }}
              >
                <Flex>
                  {__('Name', 'kirki-ecommerce')}
                </Flex>

                {filteredCountries?.length > 0 &&
                  filteredCountries?.map((country, index) => {
                    const regionInfo = formRegions.find(
                      (region) => region?.country === country.code,
                    );
                    const countryStates = (country.states ??
                      []) as CountryStateOption[];
                    return (
                      <div key={index} css={scoped(styles.checkboxItem)}>
                        <Flex gap={2} align="center">
                          <Checkbox
                            id={`tax-region-country-${country.code}`}
                            checked={
                              regionInfo?.hasDeselectedState
                                ? 'indeterminate'
                                : formCountries?.includes(country?.code)
                            }
                            onCheckedChange={() =>
                              handleSelectCountries(country)
                            }
                          />
                          <Label htmlFor={`tax-region-country-${country.code}`}>
                            {country?.flag}
                            {sprintf(__('%s', 'kirki-ecommerce'), country.name)}
                          </Label>
                        </Flex>
                        {formCountries?.includes(country.code) &&
                        countryStates.length > 0 ? (
                          <div css={scoped(styles.nestedStates)}>
                            {countryStates.map((state, stateIndex) => {
                              return (
                                <div key={stateIndex} css={scoped(styles.checkboxItem)}>
                                  <Flex gap={2} align="center">
                                    <Checkbox
                                      id={`tax-region-state-${country.code}-${state?.id}`}
                                      checked={formRegions
                                        ?.find((r) => r.id === country.code)
                                        ?.states.some((s) => s.id === state?.id)}
                                      onCheckedChange={() =>
                                        handleSelectStates(
                                          state.id,
                                          country.code,
                                          countryStates,
                                          state?.flag,
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`tax-region-state-${country.code}-${state?.id}`}
                                    >
                                      {sprintf(
                                        __('%s', 'kirki-ecommerce'),
                                        state.name,
                                      )}
                                    </Label>
                                  </Flex>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={!buttonState}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

TaxRegionPopup.displayName = 'TaxRegionPopup';

export default TaxRegionPopup;

const styles = defineStyles({
  checkboxItem: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  nestedStates: {
    padding: theme.spacing[3],
  },
});
