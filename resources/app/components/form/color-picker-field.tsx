import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
  ColorPickerValue,
} from '@/components/ui/color-picker';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

type ColorPickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  alpha?: boolean;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const ColorPickerField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  alpha,
  disabled,
  cssOverride,
}: ColorPickerFieldProps<TFieldValues, TName>) => {
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
          <ColorPicker
            value={field.value ?? ''}
            onValueChange={field.onChange}
            alpha={alpha}
            disabled={disabled}
          >
            <ColorPickerTrigger
              id={fieldId}
              error={Boolean(fieldState.error)}
              aria-invalid={fieldState.invalid}
              onBlur={field.onBlur}
            >
              <ColorPickerSwatch />
              <ColorPickerValue placeholder={placeholder} />
            </ColorPickerTrigger>
            <ColorPickerContent>
              <ColorPickerArea />
              <ColorPickerInput placeholder={placeholder} />
            </ColorPickerContent>
          </ColorPicker>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

ColorPickerField.displayName = 'ColorPickerField';

export default ColorPickerField;
