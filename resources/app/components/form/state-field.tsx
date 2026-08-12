import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import StateSelector from '@/components/state-selector';
import { Field, FieldDescription, FieldError } from '@/components/ui/field';
import { __ } from '@/wpi18n';

type StateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  country?: string | null;
  label?: string;
  description?: ReactNode;
  cssOverride?: CSSObject;
  disabled?: boolean;
};

const StateField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  country,
  label = __('State / Province', 'kirki-ecommerce'),
  description,
  cssOverride,
  disabled,
}: StateFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          <StateSelector
            label={label}
            country={country}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={Boolean(fieldState.error)}
            disabled={disabled}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

StateField.displayName = 'StateField';

export default StateField;
