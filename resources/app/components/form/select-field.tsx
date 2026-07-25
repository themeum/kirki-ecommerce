import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SelectFieldOption = {
  label: string;
  value: string;
};

type SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  options: SelectFieldOption[];
  disabled?: boolean;
  css?: SerializedStyles;
};

const SelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  options,
  disabled,
  css,
}: SelectFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} css={css}>
          {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
          <Select
            value={
              field.value === null || field.value === undefined
                ? ''
                : String(field.value)
            }
            onValueChange={(nextValue) => {
              field.onChange(nextValue === '' ? null : nextValue);
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
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

SelectField.displayName = 'SelectField';

export default SelectField;
