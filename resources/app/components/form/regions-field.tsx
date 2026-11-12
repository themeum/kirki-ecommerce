import type { CSSObject } from '@emotion/react';
import { Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Controller,
  type FieldPath,
  type FieldValues,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import { RegionsDialog } from '@/components/regions-dialog';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/chip/chip';
import ChipInput from '@/components/ui/chip/chip-input';
import { chipsInputControlCss } from '@/components/ui/chip/chip-input-styles';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
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
  disabled?: boolean;
  disabledRegions?: Region[];
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
  disabled,
  disabledRegions,
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
                <ChipInput
                  error={Boolean(fieldState.error)}
                  maxVisibleRows={2}
                  control={
                    <Button
                      variant="ghost"
                      disabled={disabled}
                      cssOverride={mergeCss(chipsInputControlCss, styles.trigger)}
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <span css={scoped(styles.value)}>
                        {tags.length > 0 ? __('Add more', 'kirki-ecommerce') : placeholder}
                      </span>
                    </Button>
                  }
                  chips={
                    tags.length > 0 &&
                    tags.map((tag) => (
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
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
            <RegionsDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              countries={countryList}
              defaultValue={dialogDefaultValue}
              disabledRegions={disabledRegions}
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
    backgroundColor: theme.colors.background.solidSurfaceAlt,
    borderRadius: theme.radius.lg,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
});
