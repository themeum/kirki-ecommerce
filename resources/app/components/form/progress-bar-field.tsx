import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError } from '@/components/ui/field';
import ProgressBar from '@/components/ui/progressbar';

type ProgressBarFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: string;
  description?: ReactNode;
  rightText?: ReactNode;
  cssOverride?: CSSObject;
};

const ProgressBarField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  rightText,
  cssOverride,
}: ProgressBarFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          <ProgressBar
            value={Number(field.value) || 0}
            onChange={(value) => field.onChange(value)}
            label={label}
            rightText={rightText}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

ProgressBarField.displayName = 'ProgressBarField';

export default ProgressBarField;
