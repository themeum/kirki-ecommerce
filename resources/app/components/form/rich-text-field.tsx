import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import RichText from '@/components/rich-text';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';

type RichTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  id?: string;
  cssOverride?: CSSObject;
};

const RichTextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  placeholder,
  id,
  cssOverride,
}: RichTextFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && <FieldLabel>{label}</FieldLabel>}
          <RichText
            id={id ?? String(name)}
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder={placeholder}
            error={Boolean(fieldState.error)}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

RichTextField.displayName = 'RichTextField';

export default RichTextField;
