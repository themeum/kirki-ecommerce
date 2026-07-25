import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import Checkbox from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

type CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  css?: SerializedStyles;
};

const CheckboxField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  css,
}: CheckboxFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} css={css}>
          <Field orientation="horizontal">
            <Checkbox
              id={fieldId}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
            {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
          </Field>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

CheckboxField.displayName = 'CheckboxField';

export default CheckboxField;
