import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  type FieldPath,
  type FieldValues,
  useFormContext,
} from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsQuery } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const weightUnitOptions = [
  { value: 'kg', label: __('kg', 'kirki-ecommerce') },
  { value: 'g', label: __('g', 'kirki-ecommerce') },
  { value: 'lb', label: __('lb', 'kirki-ecommerce') },
  { value: 'oz', label: __('oz', 'kirki-ecommerce') },
];

type WeightFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  unitName: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  disabled?: boolean;
  cssOverride?: CSSObject;
  onFieldChange?: (value: unknown, fieldName: string) => void;
};

const WeightField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  unitName,
  label,
  description,
  infoText,
  disabled,
  cssOverride,
  onFieldChange,
}: WeightFieldProps<TFieldValues, TName>) => {
  const { control, getValues } = useFormContext<TFieldValues>();
  const { data: productSettings } = useSettingsQuery('product');
  const fieldId = String(name);
  const unitFieldId = String(unitName);
  const storeWeightUnit =
    (productSettings?.weight_unit as string | undefined) || 'kg';

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: weightField, fieldState: weightState }) => (
        <Controller
          control={control}
          name={unitName}
          render={({ field: unitField, fieldState: unitState }) => {
            const hasError = Boolean(weightState.error) || Boolean(unitState.error);
            const displayUnit =
              unitField.value === null ||
                unitField.value === undefined ||
                unitField.value === ''
                ? storeWeightUnit
                : String(unitField.value);

            const handleWeightChange = (nextValue: string) => {
              weightField.onChange(nextValue);
              onFieldChange?.(
                {
                  value: nextValue,
                  unit: getValues(unitName) || storeWeightUnit,
                },
                String(name),
              );
            };

            const handleUnitChange = (nextUnit: string) => {
              unitField.onChange(nextUnit);
              onFieldChange?.(
                {
                  value: getValues(name) || '',
                  unit: nextUnit,
                },
                String(name),
              );
            };

            return (
              <Field
                data-invalid={hasError || undefined}
                cssOverride={cssOverride}
              >
                {label && (
                  <FieldLabel htmlFor={fieldId} infoText={infoText}>
                    {label}
                  </FieldLabel>
                )}
                <InputGroup error={hasError} disabled={disabled}>
                  <InputGroupInput
                    id={fieldId}
                    type="number"
                    value={weightField.value ?? ''}
                    onChange={(event) => {
                      handleWeightChange(event.target.value);
                    }}
                    onBlur={weightField.onBlur}
                    disabled={disabled}
                    aria-invalid={weightState.invalid}
                    placeholder={__('e.g. 10', 'kirki-ecommerce')}
                  />
                  <InputGroupAddon align="inline-end">
                    <Select
                      value={displayUnit}
                      onValueChange={handleUnitChange}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={unitFieldId}
                        variant="invisible"
                        aria-invalid={unitState.invalid}
                        cssOverride={styles.unitTrigger}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weightUnitOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputGroupAddon>
                </InputGroup>
                {description && (
                  <FieldDescription>{description}</FieldDescription>
                )}
                {hasError && (
                  <FieldError
                    errors={[weightState.error, unitState.error]}
                  />
                )}
              </Field>
            );
          }}
        />
      )}
    />
  );
};

WeightField.displayName = 'WeightField';

export default WeightField;

const styles = defineStyles({
  unitTrigger: {
    width: 'auto',
    minWidth: '64px',
    paddingRight: theme.spacing[2],
  },
});
