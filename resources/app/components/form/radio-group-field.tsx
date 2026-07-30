import { type CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { scoped } from '@/theme/mixins';

type RadioGroupFieldOption = {
  label: string;
  value: string;
};

type RadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  options: RadioGroupFieldOption[];
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const RadioGroupField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  options,
  disabled,
  cssOverride,
}: RadioGroupFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && <FieldLabel>{label}</FieldLabel>}
          <RadioGroup
            value={field.value ?? ''}
            onValueChange={field.onChange}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            cssOverride={styles.groupField}
          >
            {options.map((option) => {
              const optionId = `${String(name)}-${option.value}`;

              return (
                <Field key={option.value} orientation="horizontal">
                  <RadioGroupItem value={option.value} id={optionId} />
                  <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                </Field>
              );
            })}
          </RadioGroup>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

RadioGroupField.displayName = 'RadioGroupField';

export default RadioGroupField;

const styles = {
  groupField: scoped({
    display: 'flex',
    flexDirection: 'row',
  })
}
