import type { CSSObject } from '@emotion/react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext, useWatch } from 'react-hook-form';

import { RegionsDialog } from '@/components/regions-dialog';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip';
import ChipField from '@/components/ui/chip-field';
import { chipFieldControlCss } from '@/components/ui/chip-field-styles';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { LocationIcon } from '@/icons';
import type { Region } from '@/schemas/shared/region';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, mergeCss, scoped } from '@/theme/mixins';
import { getSelectedRegionTags } from '@/utils/region';
import { __ } from '@/wpi18n';

type RegionsFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: string;
  infoText?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const emptyRegions: Region[] = [];

const RegionsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  infoText,
  placeholder = __('Select destinations..', 'kirki-ecommerce'),
  emptyText = __('Added destinations will appear here', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: RegionsFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  const regions = (useWatch({ control, name }) as Region[] | null) ?? emptyRegions;

  const dialogDefaultValue = useMemo(
    () => ({
      countryCodes: regions.map((region) => region.country),
      regions,
    }),
    [regions],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const tags = getSelectedRegionTags(regions, countryList);

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
                    <Button
                      variant="ghost"
                      disabled={disabled}
                      cssOverride={mergeCss(chipFieldControlCss, styles.trigger)}
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <span css={scoped(styles.value)}>{placeholder}</span>
                      <span css={scoped(styles.chevron)}>
                        <ChevronDownIcon width={16} height={16} />
                      </span>
                    </Button>
                  }
                  chips={
                    tags.length > 0 && tags.map((tag) => (
                      <Chip
                        key={tag.id}
                        text={tag.title}
                        img={<span>{tag.tagIcon}</span>}
                        subText={tag.subText}
                        closeIcon={<Minus size={14} aria-hidden="true" />}
                        onRemove={() => removeRegion(tag.id)}
                      />
                    ))
                  }
                />
                {tags.length === 0 && (
                  <div css={scoped(styles.emptyState)}>
                    <LocationIcon />
                    <span css={scoped(styles.emptyStateText)}>{emptyText}</span>
                  </div>
                )}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
            <RegionsDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              countries={countryList}
              defaultValue={dialogDefaultValue}
              from="edit"
              onDone={(values) => {
                field.onChange(values.regions);
                setIsDialogOpen(false);
              }}
            />
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
  trigger: {
    ...itemCenter(),
    ...theme.typography.small(),
    height: '36px',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    textAlign: 'left',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
    },
    '&:active:not([aria-haspopup])': {
      transform: 'none',
    },
  },
  value: {
    ...itemCenter(),
    columnGap: theme.spacing[2],
    maxWidth: '85%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    ...flexCenter(),
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
    marginTop: theme.spacing[2],
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.lg,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
});
