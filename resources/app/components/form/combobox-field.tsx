import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import Combobox from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

type ComboboxFieldOption = {
  label: string;
  value: string;
};

type ComboboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxFieldOption[];
  creatable?: boolean;
  addItemLabel?: string;
  onAddItem?: (query: string) => void;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const ComboboxField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
  creatable = false,
  addItemLabel,
  onAddItem,
  disabled,
  cssOverride,
}: ComboboxFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid || undefined}
          cssOverride={cssOverride}
        >
          {label && (
            <FieldLabel htmlFor={fieldId} infoText={infoText}>
              {label}
            </FieldLabel>
          )}
          <Combobox
            options={options}
            value={
              field.value === null || field.value === undefined
                ? ''
                : String(field.value)
            }
            onChange={(nextValue) => {
              const value = Array.isArray(nextValue)
                ? nextValue[0] ?? ''
                : nextValue;
              field.onChange(value === '' ? null : value);
            }}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyText={emptyText}
            creatable={creatable}
            addItemLabel={addItemLabel}
            onAddItem={onAddItem}
            disabled={disabled}
            error={Boolean(fieldState.error)}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

ComboboxField.displayName = 'ComboboxField';

export default ComboboxField;
