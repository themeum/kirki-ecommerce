import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import MultiSelectField from '@/components/form/multi-select-field';
import SelectField from '@/components/form/select-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import type { GeneralSettingsFormValues } from '@/schemas/forms/general-settings-form';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const sellingLocationOptions = [
  {
    label: __('All Countries', 'kirki-ecommerce'),
    value: 'all-countries',
  },
  {
    label: __('Specific Countries', 'kirki-ecommerce'),
    value: 'selected-countries',
  },
  {
    label: __('All Countries Except', 'kirki-ecommerce'),
    value: 'excluded-countries',
  },
];

const SellingLocation = () => {
  const { setValue, getValues } = useFormContext<GeneralSettingsFormValues>();
  const sellingLocation = useWatch<GeneralSettingsFormValues>({
    name: 'selling_location_type',
  });
  const previousSellingLocation = useRef(sellingLocation);
  const { data: countryList } = useCountriesQuery({ limit: -1 });

  const countryOptions = (countryList ?? []).map((country) => ({
    label: country.name,
    value: country.name,
  }));

  useEffect(() => {
    if (
      previousSellingLocation.current !== sellingLocation &&
      sellingLocation === 'all-countries'
    ) {
      const selectedCountries = getValues('selling_countries') ?? [];
      if (selectedCountries.length > 0) {
        setValue('selling_countries', [], { shouldDirty: true });
      }
    }
    previousSellingLocation.current = sellingLocation;
  }, [sellingLocation, getValues, setValue]);

  const showCountrySelector =
    sellingLocation === 'selected-countries' ||
    sellingLocation === 'excluded-countries';

  return (
    <div>
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Selling Locations', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Select the countries where you want to sell your products.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerCardContent}>
              <Flex direction="column" gap={16}>
                <SelectField
                  name="selling_location_type"
                  label={__('Selling', 'kirki-ecommerce')}
                  description={__(
                    'Select the countries where you want to sell your products.',
                    'kirki-ecommerce',
                  )}
                  options={sellingLocationOptions}
                />

                {showCountrySelector && (
                  <MultiSelectField
                    name="selling_countries"
                    label={__('Countries', 'kirki-ecommerce')}
                    placeholder={__('Add Countries', 'kirki-ecommerce')}
                    searchPlaceholder={__('e.g United States', 'kirki-ecommerce')}
                    options={countryOptions}
                  />
                )}
              </Flex>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

SellingLocation.displayName = 'SellingLocation';

export default SellingLocation;

const styles = {
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerCardContent: scoped({
    padding: theme.spacing['2xl'],
  }),
};
