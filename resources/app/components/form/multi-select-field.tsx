import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import Combobox, { type ComboboxOption } from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

type MultiSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[];
  disabled?: boolean;
  css?: SerializedStyles;
  multiple?: boolean;
};

const MultiSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
  disabled,
  css,
  multiple = true,
}: MultiSelectFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} css={css}>
          {label && <FieldLabel>{label}</FieldLabel>}
          <Combobox
            options={options}
            value={field.value ?? (multiple ? [] : '')}
            onChange={field.onChange}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyText={emptyText}
            disabled={disabled}
            error={Boolean(fieldState.error)}
            multiple={multiple}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

MultiSelectField.displayName = 'MultiSelectField';

export default MultiSelectField;
