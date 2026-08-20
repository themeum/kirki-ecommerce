import type { CSSObject } from '@emotion/react';
import type { ChangeEvent, FocusEvent, KeyboardEvent, ReactNode, WheelEvent } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext, useWatch } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Input from '@/components/ui/input';
import { isDefined } from '@/utils/object';

type NumberFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
  min?: number | null;
  max?: number | null;
  readOnly?: boolean
  showError?: boolean;
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
  disabled,
  cssOverride,
  min,
  max,
  readOnly,
  showError = true,
}: NumberFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const currentValue = useWatch({ control, name });
  const fieldId = String(name);

  const preventStepKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  };

  const preventStepScroll = (event: WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur();
  };

  const clampValue = (value: number) => {
    if (isDefined(min) && value < min) {
      return min;
    }

    if (isDefined(max) && value > max) {
      return max;
    }

    return value;
  };

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
            value={currentValue ?? ''}
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            error={Boolean(fieldState.error)}
            aria-invalid={fieldState.invalid}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const nextValue = event.target.value;
              field.onChange(nextValue === '' ? undefined : Number(nextValue));
            }}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              field.onBlur();

              const enteredValue = Number(event.target.value);

              if (event.target.value === '' || Number.isNaN(enteredValue)) {
                return;
              }

              const clampedValue = clampValue(enteredValue);

              if (clampedValue !== enteredValue) {
                field.onChange(clampedValue);
              }
            }}
            onKeyDown={preventStepKeys}
            onWheel={preventStepScroll}
            name={field.name}
            ref={field.ref}
            onFocus={event => event.target.select()}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && showError && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

NumberField.displayName = 'NumberField';

export default NumberField;
