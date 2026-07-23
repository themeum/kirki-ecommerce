import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import CountrySelector from '@/components/country-selector';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { __ } from '@/wpi18n';

type CountryFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: string;
  description?: ReactNode;
  css?: SerializedStyles;
};

const CountryField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label = __('Country / Region', 'kirki-ecommerce'),
  description,
  css,
}: CountryFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem css={css}>
          <FormControl>
            <CountrySelector
              label={label}
              value={field.value ?? ''}
              onChange={field.onChange}
              error={Boolean(fieldState.error)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

CountryField.displayName = 'CountryField';

export default CountryField;
