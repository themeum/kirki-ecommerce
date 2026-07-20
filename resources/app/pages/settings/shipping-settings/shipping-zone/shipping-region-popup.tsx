import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import TextField from '@/components/form/text-field';
import { Form } from '@/components/ui/form';
import { SearchIcon, LocationIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import {
  Popover,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
} from '@/molecules/popover';
import { CLASS_PREFIX } from '@/conf';
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

  return (
    <Popover isOpen={openPopup}>
      <PopoverHeader
        borderBottom
        leftIcon={<LocationIcon />}
        onClose={() => setOpenPopup(false)}
      >
        {__('Add shipping region', 'kirki-ecommerce')}
      </PopoverHeader>
      <Form {...form}>
        <PopoverBody
          style={{
            padding: 'var(--decom-spacing-2) var(--decom-spacing-5)',
            rowGap: 'var( --decom-spacing-2)',
          }}
        >
          {from === 'add' && (
            <TextField
              name="title"
              label={__('Title', 'kirki-ecommerce')}
              placeholder={__('Zone 2- South Asia', 'kirki-ecommerce')}
            />
          )}

          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__('Select countries', 'kirki-ecommerce')}
            placeholder={__('Search country or state', 'kirki-ecommerce')}
            onChange={(value) => handleSearchRegion(String(value))}
            error={
              (form.formState.errors.regions?.message as string) ||
              (errors?.regions as string) ||
              ''
            }
          />

          <Card
            type={'table'}
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
                        <Checkbox
                          value={formCountries.includes(country?.code)}
                          isPartialChecked={regionInfo?.hasDeselectedState}
                          label={country.name}
                          onChange={() => handleSelectCountries(country)}
                          leftIcon={country?.flag}
                        />
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
                              <Checkbox
                                value={formRegions
                                  ?.find((r) => r.country === country.code)
                                  ?.states.includes(state.id)}
                                label={state.name}
                                onChange={() =>
                                  handleSelectStates(
                                    state.id,
                                    country.code,
                                    country.states,
                                  )
                                }
                              />
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
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__('Cancel', 'kirki-ecommerce')}
            size="small"
            onClick={() => handleCancelButton()}
          />
          <Button
            type="primary"
            text={__('Done', 'kirki-ecommerce')}
            size="small"
            onClick={form.handleSubmit(handleDone)}
            state={buttonState ? 'disabled' : ''}
          />
        </PopoverFooter>
      </Form>
    </Popover>
  );
};

ShippingRegionPopup.displayName = 'ShippingRegionPopup';
