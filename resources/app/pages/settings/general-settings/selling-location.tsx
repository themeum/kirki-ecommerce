import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import MultiSelectField from '@/components/form/multi-select-field';
import SelectField from '@/components/form/select-field';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import type { GeneralSettingsFormValues } from '@/schemas/forms/general-settings-form';
import { useCountriesQuery } from '@/services/country';
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
      <Card type="large">
        <Text
          header={__('Selling Locations', 'kirki-ecommerce')}
          subHeader={__(
            'Select the countries where you want to sell your products.',
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />

        <Card type="inner" style={{ padding: 'var(--decom-spacing-4)' }}>
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
        </Card>
      </Card>
    </div>
  );
};

SellingLocation.displayName = 'SellingLocation';

export default SellingLocation;
