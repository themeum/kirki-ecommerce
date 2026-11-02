import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { theme } from '@/theme';

type BooleanRadioFieldOption = {
  label: string;
  value: boolean;
};

type BooleanRadioFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  options: [BooleanRadioFieldOption, BooleanRadioFieldOption];
};

const BooleanRadioField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  options,
}: BooleanRadioFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          {label && <FieldLabel>{label}</FieldLabel>}
          <RadioGroup
            value={String(Boolean(field.value))}
            onValueChange={(value) => field.onChange(value === 'true')}
            aria-invalid={fieldState.invalid}
            cssOverride={{ flexDirection: 'row', gap: theme.spacing[4] }}
          >
            {options.map((option) => {
              const optionId = `${String(name)}-${String(option.value)}`;

              return (
                <Field key={optionId} orientation="horizontal">
                  <RadioGroupItem value={String(option.value)} id={optionId} />
                  <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                </Field>
              );
            })}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

BooleanRadioField.displayName = 'BooleanRadioField';

export default BooleanRadioField;
