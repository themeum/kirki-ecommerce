import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogCloseButton, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  type ShippingRegionFormInput,
  type ShippingRegionFormPayload,
  ShippingRegionFormSchema,
} from '@/features/settings/shipping/schemas/forms/shipping-region-form';
import type { CountryWithStates, ShippingRegion } from '@/features/settings/shipping/types';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import type { FormErrors } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type ShippingRegionPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredCountries: CountryWithStates[];
  onSearchChange?: (value: string) => void;
  initialCountries?: string[];
  initialRegions?: ShippingRegion[];
  initialTitle?: string;
  from?: 'add' | 'edit' | '';
  onDone: (values: ShippingRegionFormPayload) => void;
  errors?: FormErrors;
};

export const ShippingRegionPopup = ({
  open,
  onOpenChange,
  filteredCountries,
  onSearchChange,
  initialCountries = [],
  initialRegions = [],
  initialTitle = '',
  from = '',
  onDone,
  errors,
}: ShippingRegionPopupProps) => {
  const [searchValue, setSearchValue] = useState('');

  const form = useForm<ShippingRegionFormInput, unknown, ShippingRegionFormPayload>({
    resolver: zodResolver(ShippingRegionFormSchema),
    defaultValues: getDefaults(ShippingRegionFormSchema),
  });

  const formCountries =
    useWatch({ control: form.control, name: 'countries' }) || [];
  const formRegions =
    useWatch({ control: form.control, name: 'regions' }) || [];
  const formTitle = useWatch({ control: form.control, name: 'title' }) || '';

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      title: initialTitle,
      countries: initialCountries,
      regions: initialRegions,
    });
    setSearchValue('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds the form from the initial props only as the dialog opens; tracking them would reset the form while the user is picking regions
  }, [open]);

  useEffect(() => {
    if (errors?.title) {
      form.setError('title', { message: String(errors.title) });
    }
    if (errors?.regions) {
      form.setError('regions', { message: String(errors.regions) });
    }
  }, [errors, form]);

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
  };

  const handleSelectStates = (
    stateId: string | number,
    countryCode: string,
    allStates: { id: string | number; name: string }[] = [],
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
  };

  const handleCancelButton = () => {
    form.reset({
      title: initialTitle,
      countries: [...initialCountries],
      regions: [...initialRegions],
    });
    onOpenChange(false);
  };

  const handleSearchRegion = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  const buttonState =
    (from === 'add' && !String(formTitle || '').trim()) ||
    formCountries.length === 0;

  const searchError =
    form.formState.errors.regions?.message ||
    (errors?.regions as string) ||
    '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
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
          <DialogBody>
            {from === 'add' && (
              <TextField
                name="title"
                label={__('Title', 'kirki-ecommerce')}
                placeholder={__('Zone 2 - South Asia', 'kirki-ecommerce')}
              />
            )}

            <Flex direction="column" gap={2}>
              <Label htmlFor="shipping-region-search">
                {__('Select countries', 'kirki-ecommerce')}
              </Label>
              <Input
                id="shipping-region-search"
                type="search"
                placeholder={__('Search country or state', 'kirki-ecommerce')}
                value={searchValue}
                onChange={(e) => handleSearchRegion(e.target.value)}
                error={Boolean(searchError)}
              />
            </Flex>

            <Card cssOverride={cardStyles.tableCardRounded}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <div css={scoped(styles.scrollArea)}>
                  <Flex>
                    {__('Name', 'kirki-ecommerce')}
                  </Flex>

                  {filteredCountries?.length > 0 &&
                    filteredCountries.map((country, index) => {
                      const regionInfo = formRegions.find(
                        (r) => r.country === country.code,
                      );
                      return (
                        <div key={index}>
                          <div css={scoped(styles.checkboxItem)}>
                            <Flex gap={2} align="center">
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
                            <div css={scoped(styles.nestedStates)}>
                              {(country?.states ?? []).map((state, stateIndex) => (
                                <div key={stateIndex} css={scoped(styles.checkboxItem)}>
                                  <Flex gap={2} align="center">
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
              </CardContent>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleCancelButton()}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(onDone)}
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

const styles = defineStyles({
  scrollArea: {
    height: '432px',
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  checkboxItem: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  nestedStates: {
    padding: `${theme.spacing[0]} ${theme.spacing[3]}`,
  },
});
