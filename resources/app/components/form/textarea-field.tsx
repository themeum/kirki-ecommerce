import { type SerializedStyles } from '@emotion/react';
import type { ReactNode } from 'react';
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import Textarea from '@/components/ui/textarea';

type TextareaFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  css?: SerializedStyles;
};

const TextareaField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  rows = 5,
  disabled,
  css,
}: TextareaFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} css={css}>
          {label && <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>}
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
