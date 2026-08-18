import type { CSSObject } from '@emotion/react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';

type TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  type?: ComponentPropsWithoutRef<typeof Input>['type'];
  disabled?: boolean;
  readOnly?: boolean;
  onClick?: () => void;
  cssOverride?: CSSObject;
  autoFocus?: boolean;
};

const TextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  type = 'text',
  disabled,
  readOnly,
  onClick,
  cssOverride,
  autoFocus = false,
}: TextFieldProps<TFieldValues, TName>) => {
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
            {...field}
            id={fieldId}
            value={field.value ?? ''}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            onClick={onClick}
            error={Boolean(fieldState.error)}
            aria-invalid={fieldState.invalid}
            // eslint-disable-next-line jsx-a11y/no-autofocus -- opt-in prop, the caller decides whether the field should take focus
            autoFocus={autoFocus}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

TextField.displayName = 'TextField';

export default TextField;
