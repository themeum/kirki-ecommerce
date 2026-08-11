import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Textarea from '@/components/ui/textarea';

type TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const TextareaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  rows = 5,
  disabled,
  cssOverride,
}: TextareaFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && (
            <FieldLabel htmlFor={fieldId} infoText={infoText}>
              {label}
            </FieldLabel>
          )}
          <Textarea
            {...field}
            id={fieldId}
            value={field.value ?? ''}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            error={Boolean(fieldState.error)}
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

TextareaField.displayName = 'TextareaField';

export default TextareaField;
