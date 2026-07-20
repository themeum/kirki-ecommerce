import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';
import Flex from '@/molecules/flex';
import {
  ShippingRegionFormSchema,
  shippingRegionDefaultValues,
  type ShippingRegionFormValues,
} from '@/schemas/forms/shipping-region-form';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import type {
  CountryWithStates,
  ShippingRegion,
} from '@/pages/settings/shipping-settings/utils';

type ShippingRegionPopupProps = {
  filteredCountries: CountryWithStates[];
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  selectedCountries?: string[];
  setSelectedCountries?: Dispatch<SetStateAction<string[]>>;
  setSelectedRegion?: Dispatch<SetStateAction<ShippingRegion[]>>;
  selectedRegion?: ShippingRegion[];
  setSearchValue?: ((value: string) => void) | null;
  shippingZoneTitle?: string;
  setShippingZoneTitle?: (value: string) => void;
  from?: string;
  onAdd?: () => void;
  onSave?: (values: ShippingRegionFormValues) => void;
  errors?: FormErrors;
};

export const ShippingRegionPopup = ({
  filteredCountries,
  openPopup,
  setOpenPopup,
  selectedCountries = [],
  setSelectedCountries = () => {},
  setSelectedRegion = () => {},
  selectedRegion = [],
  setSearchValue = null,
  shippingZoneTitle,
  setShippingZoneTitle,
  from = '',
  onAdd = () => {},
  onSave,
  errors,
}: ShippingRegionPopupProps) => {
  const [initialDataObj] = useState({
    countries: selectedCountries || [],
    regions: selectedRegion || [],
    title: shippingZoneTitle || '',
  });

  const form = useForm<ShippingRegionFormValues>({
    resolver: zodResolver(ShippingRegionFormSchema),
    defaultValues: shippingRegionDefaultValues,
  });

  const formCountries =
    useWatch({ control: form.control, name: 'countries' }) || [];
  const formRegions =
    useWatch({ control: form.control, name: 'regions' }) || [];
  const formTitle = useWatch({ control: form.control, name: 'title' }) || '';

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({
      title: shippingZoneTitle || '',
      countries: selectedCountries || [],
      regions: selectedRegion || [],
    });
  }, [openPopup, form]);

  useEffect(() => {
    if (errors?.title) {
      form.setError('title', { message: String(errors.title) });
    }
    if (errors?.regions) {
      form.setError('regions', { message: String(errors.regions) });
    }
  }, [errors, form]);

  useEffect(() => {
    if (from === 'add') {
      setShippingZoneTitle?.(String(formTitle || ''));
    }
  }, [formTitle, from, setShippingZoneTitle]);

  const syncParent = (
    countries: string[],
    regions: ShippingRegion[],
    title?: string | null,
  ) => {
    setSelectedCountries(countries);
    setSelectedRegion(regions);
    if (from === 'add' && title !== undefined) {
      setShippingZoneTitle?.(title ?? '');
    }
  };

  const handleSelectCountries = (country: CountryWithStates) => {
    const countries = form.getValues('countries') || [];
    const regions = form.getValues('regions') || [];
    const isSelected = countries.includes(country.code);

    const nextCountries = isSelected
      ? countries.filter((c) => c !== country.code)
      : [...countries, country.code];

    const nextRegions = isSelected
      ? regions.filter((r) => r.country !== country.code)
      : [
          ...regions,
          {
            country: country.code,
            states: (country.states ?? []).map((s) => s.id),
            hasDeselectedState: false,
            flag: country?.flag,
          },
        ];

    form.setValue('countries', nextCountries, { shouldValidate: true });
    form.setValue('regions', nextRegions, { shouldValidate: true });
    syncParent(nextCountries, nextRegions, form.getValues('title'));
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: Array<{ id: string | number; name: string }> = [],
  ) => {
    const regions = form.getValues('regions') || [];
    const countries = form.getValues('countries') || [];
    const countryIndex = regions.findIndex(
      (item) => item.country === countryCode,
    );

    if (countryIndex === -1) {
      return;
    }

    const countryItem = regions[countryIndex];
    const stateExists = countryItem.states.includes(stateId);

    const updatedStates = stateExists
      ? countryItem.states.filter((id) => id !== stateId)
      : [...countryItem.states, stateId];

    if (updatedStates.length === 0) {
      const nextCountries = countries.filter((c) => c !== countryCode);
      const nextRegions = regions.filter((_, i) => i !== countryIndex);
      form.setValue('countries', nextCountries, { shouldValidate: true });
      form.setValue('regions', nextRegions, { shouldValidate: true });
      syncParent(nextCountries, nextRegions, form.getValues('title'));
      return;
    }

    const hasDeselectedState = updatedStates.length !== allStates.length;
    const nextRegions = regions.map((item, index) =>
      index === countryIndex
        ? {
            ...item,
            states: updatedStates,
            hasDeselectedState,
          }
        : item,
    );

    form.setValue('regions', nextRegions, { shouldValidate: true });
    syncParent(countries, nextRegions, form.getValues('title'));
  };

  const handleCancelButton = () => {
    form.reset({
      title: initialDataObj.title,
      countries: [...initialDataObj.countries],
      regions: [...initialDataObj.regions],
    });
    setSelectedCountries([...initialDataObj.countries]);
    setSelectedRegion([...initialDataObj.regions]);
    if (from === 'add') {
      setShippingZoneTitle?.(initialDataObj.title);
    }
    setOpenPopup(false);
  };

  const handleSearchRegion = (value: string) => {
    setSearchValue?.(value);
  };

  const handleDone = (values: ShippingRegionFormValues) => {
    syncParent(values.countries, values.regions, values.title);
    if (onSave) {
      onSave(values);
      return;
    }
    onAdd();
  };

  const buttonState =
    (from === 'add' && !String(formTitle || '').trim()) ||
    formCountries.length === 0;

  const searchError =
    (form.formState.errors.regions?.message as string) ||
    (errors?.regions as string) ||
    '';

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
          <DialogTitle>
            {__('Add shipping region', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className={`${CLASS_PREFIX}-ui-dialog-body`}>
            {from === 'add' && (
              <TextField
                name="title"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('Zone 2- South Asia', 'kirki-ecommerce')}
              />
            )}

            <Flex direction="column" gap={8}>
              <Label htmlFor="shipping-region-search">
                {__('Select countries', 'kirki-ecommerce')}
              </Label>
              <Input
                id="shipping-region-search"
                type="search"
                placeholder={__('Search country or state', 'kirki-ecommerce')}
                onChange={(e) => handleSearchRegion(e.target.value)}
                error={Boolean(searchError)}
              />
            </Flex>

            <Card
              className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-table`}
              style={{ borderRadius: 'var(--decom-radius-rounded-md)' }}
            >
              <div
                style={{
                  height: '432px',
                  overflowX: 'hidden',
                  overflowY: 'scroll',
                }}
              >
                <Flex className={`${CLASS_PREFIX}-popover-heading-wrapper-dark`}>
                  {__('Name', 'kirki-ecommerce')}
                </Flex>

                {filteredCountries?.length > 0 &&
                  filteredCountries.map((country, index) => {
                    const regionInfo = formRegions.find(
                      (r) => r.country === country.code,
                    );
                    return (
                      <div key={index}>
                        <div className={`${CLASS_PREFIX}-checkbox-item`}>
                          <Flex gap={8} style={{ alignItems: 'center' }}>
                            <Checkbox
                              id={`shipping-region-country-${country.code}`}
                              checked={
                                regionInfo?.hasDeselectedState
                                  ? 'indeterminate'
                                  : formCountries.includes(country?.code)
                              }
                              onCheckedChange={() =>
                                handleSelectCountries(country)
                              }
                            />
                            <Label
                              htmlFor={`shipping-region-country-${country.code}`}
                            >
                              {country?.flag}
                              {country.name}
                            </Label>
                          </Flex>
                        </div>
                        {formCountries.includes(country.code) &&
                        (country?.states?.length ?? 0) > 0 ? (
                          <div
                            style={{
                              padding:
                                'var(--decom-spacing-0) var(--decom-spacing-3)',
                            }}
                          >
                            {(country?.states ?? []).map((state, stateIndex) => (
                              <div
                                key={stateIndex}
                                className={`${CLASS_PREFIX}-checkbox-item`}
                              >
                                <Flex gap={8} style={{ alignItems: 'center' }}>
                                  <Checkbox
                                    id={`shipping-region-state-${country.code}-${state.id}`}
                                    checked={formRegions
                                      ?.find((r) => r.country === country.code)
                                      ?.states.includes(state.id)}
                                    onCheckedChange={() =>
                                      handleSelectStates(
                                        state.id,
                                        country.code,
                                        country.states,
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`shipping-region-state-${country.code}-${state.id}`}
                                  >
                                    {state.name}
                                  </Label>
                                </Flex>
                              </div>
                            ))}
                          </div>
                        ) : (
                          ''
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelButton()}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={form.handleSubmit(handleDone)}
              disabled={buttonState}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ShippingRegionPopup.displayName = 'ShippingRegionPopup';
