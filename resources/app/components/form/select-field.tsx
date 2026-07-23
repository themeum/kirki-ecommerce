import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem css={css}>
          {label && <FormLabel>{label}</FormLabel>}
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
            <FormControl>
              <SelectTrigger error={Boolean(fieldState.error)}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

SelectField.displayName = 'SelectField';

export default SelectField;
