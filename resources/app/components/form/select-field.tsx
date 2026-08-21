import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SelectFieldOption = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  disabled?: boolean;
};

type SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  options: SelectFieldOption[];
  disabled?: boolean;
  cssOverride?: CSSObject;
  onValueChange?: (value: string | null) => void;
};

const SelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  options,
  disabled,
  cssOverride,
  onValueChange,
}: SelectFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && (
              <FieldLabel htmlFor={fieldId} infoText={infoText}>
                {label}
              </FieldLabel>
            )}
            <Select
              value={
                field.value === null || field.value === undefined
                  ? ''
                  : String(field.value)
              }
              onValueChange={(nextValue) => {
                field.onChange(nextValue === '' ? null : nextValue);
                onValueChange?.(nextValue === '' ? null : nextValue);
              }}
              disabled={disabled}
            >
              <SelectTrigger
                id={fieldId}
                error={Boolean(fieldState.error)}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={String(option.value)}
                    value={String(option.value)}
                    disabled={option.disabled}
                  >
                    {option.icon}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )
      }}
    />
  );
};

SelectField.displayName = 'SelectField';

export default SelectField;
