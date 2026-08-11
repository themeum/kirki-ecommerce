import type { CSSObject } from '@emotion/react';
import { Minus } from 'lucide-react';
import { useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import Chip from '@/components/ui/chip';
import ChipField, { chipFieldControlCss } from '@/components/ui/chip-field';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { LocationIcon } from '@/icons';
import { ShippingRegionPopup } from '@/pages/settings/shipping-settings/shipping-zone/shipping-region-dialog';
import {
  type CountryWithStates,
  getSearchedCountries,
  getSelectedRegionTags,
  type ShippingRegion,
} from '@/pages/settings/shipping-settings/utils';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type RegionsFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: string;
  infoText?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const RegionsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  infoText,
  disabled,
  cssOverride,
}: RegionsFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [searchValue, setSearchValue] = useState('');
  const [pickingCountry, setPickingCountry] = useState<CountryWithStates | null>(null);

  const { data: countryData = [] } = useCountriesQuery({ limit: -1 });
  const countryList = countryData as CountryWithStates[];

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const regions = (field.value as ShippingRegion[] | null) ?? [];
        const tags = getSelectedRegionTags(regions, countryList);
        const searchMatches = searchValue
          ? getSearchedCountries(searchValue, countryList).filter(
            (country) => !regions.some((region) => region.country === country.code),
          )
          : [];

        const addCountry = (country: CountryWithStates) => {
          setSearchValue('');
          if ((country.states?.length ?? 0) > 0) {
            setPickingCountry(country);
            return;
          }
          field.onChange([...regions, { country: country.code, states: [], flag: country.flag }]);
        };

        const removeRegion = (countryCode: string) => {
          field.onChange(regions.filter((region) => region.country !== countryCode));
        };

        return (
          <>
            <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
              {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
              <div css={scoped(styles.wrapper)}>
                <ChipField
                  error={Boolean(fieldState.error)}
                  control={
                    <Input
                      value={searchValue}
                      placeholder={__('Type to add destinations..', 'kirki-ecommerce')}
                      disabled={disabled}
                      cssOverride={chipFieldControlCss}
                      onChange={(event) => setSearchValue(event.target.value)}
                    />
                  }
                  chips={
                    tags.length > 0
                      ? tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          text={tag.title}
                          img={tag.tagIcon}
                          subText={tag.subText}
                          closeIcon={<Minus size={14} aria-hidden="true" />}
                          onRemove={() => removeRegion(tag.id)}
                        />
                      ))
                      : undefined
                  }
                />
                {searchMatches.length > 0 && (
                  <div css={scoped(styles.dropdown)}>
                    {searchMatches.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        css={scoped(styles.dropdownItem)}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          addCountry(country);
                        }}
                      >
                        {country.flag} {country.name}
                      </button>
                    ))}
                  </div>
                )}
                {tags.length === 0 && !searchValue && (
                  <div css={scoped(mergeCss(styles.emptyState))}>
                    <LocationIcon />
                    <span css={scoped(styles.emptyStateText)}>
                      {__('Added destinations will appear here', 'kirki-ecommerce')}
                    </span>
                  </div>
                )}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
            {pickingCountry && (
              <ShippingRegionPopup
                open={Boolean(pickingCountry)}
                onOpenChange={(open) => {
                  if (!open) {
                    setPickingCountry(null);
                  }
                }}
                filteredCountries={[pickingCountry]}
                initialCountries={[pickingCountry.code]}
                initialRegions={[
                  {
                    country: pickingCountry.code,
                    states: (pickingCountry.states ?? []).map((state) => state.id),
                    flag: pickingCountry.flag,
                  },
                ]}
                from="edit"
                onDone={(values) => {
                  const pickedRegion = values.regions.find((region) => region.country === pickingCountry.code);
                  field.onChange(
                    pickedRegion ? [...regions, pickedRegion] : regions,
                  );
                  setPickingCountry(null);
                }}
              />
            )}
          </>
        );
      }}
    />
  );
};

RegionsField.displayName = 'RegionsField';

export default RegionsField;

const styles = defineStyles({
  wrapper: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    zIndex: theme.zIndex.dropdown,
    maxHeight: '240px',
    overflowY: 'auto',
    backgroundColor: theme.colors.background.surface,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.md,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
});
