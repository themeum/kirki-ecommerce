import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';

type NumberFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  readOnly?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const NumberField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  min,
  max,
  step,
  readOnly,
  disabled,
  cssOverride,
}: NumberFieldProps<TFieldValues, TName>) => {
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
          <Input
            id={fieldId}
            value={field.value ?? ''}
            placeholder={placeholder}
            type="number"
            min={min}
            max={max}
            step={step}
            readOnly={readOnly}
            disabled={disabled}
            onChange={(event) => {
              const value = event.target.value;
              field.onChange(value === '' ? null : value);
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            error={Boolean(fieldState.error)}
            aria-invalid={fieldState.invalid}
            onFocus={event => event.target.select()}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

NumberField.displayName = 'NumberField';

export default NumberField;
