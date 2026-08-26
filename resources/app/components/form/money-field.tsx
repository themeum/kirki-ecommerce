import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import NumberInput from '@/components/ui/number-input';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type MoneyFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  currencySymbol?: string;
  showSymbolWhenEmpty?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
  autoFocus?: boolean;
};

const MoneyField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  currencySymbol = '$',
  showSymbolWhenEmpty = true,
  disabled,
  cssOverride,
  autoFocus = false
}: MoneyFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasValue =
          field.value !== null &&
          field.value !== undefined &&
          field.value !== '';
        const showSymbol = showSymbolWhenEmpty || hasValue;

        return (
          <Field
            data-invalid={fieldState.invalid || undefined}
            cssOverride={cssOverride}
          >
            {label && (
              <FieldLabel htmlFor={fieldId} infoText={infoText}>
                {label}
              </FieldLabel>
            )}
            <div css={scoped({ position: 'relative' })}>
              {showSymbol && (
                <span
                  css={scoped({
                    color: theme.colors.text.secondary,
                    position: 'absolute',
                    left: theme.spacing[3],
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  })}
                >
                  {currencySymbol}
                </span>
              )}
              <NumberInput
                id={fieldId}
                value={field.value ?? ''}
                style={{ textIndent: showSymbol ? '12px' : undefined }}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(event) => {
                  field.onChange(event.target.value);
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={Boolean(fieldState.error)}
                aria-invalid={fieldState.invalid}
                onFocus={event => event.target.select()}
                autoFocus={autoFocus}
              />
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

MoneyField.displayName = 'MoneyField';

export default MoneyField;
