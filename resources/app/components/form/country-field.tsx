import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import CountrySelector from '@/components/country-selector';
import {
  Field,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';
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
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} css={css}>
          <CountrySelector
            label={label}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={Boolean(fieldState.error)}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

CountryField.displayName = 'CountryField';

export default CountryField;
