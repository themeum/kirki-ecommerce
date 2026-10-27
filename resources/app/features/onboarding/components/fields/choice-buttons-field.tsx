import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { theme } from '@/theme';
import { defineStyles, uiFocusRing } from '@/theme/mixins';

type ChoiceButtonsFieldOption = {
  label: string;
  value: boolean;
};

type ChoiceButtonsFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  options: [ChoiceButtonsFieldOption, ChoiceButtonsFieldOption];
};

const ChoiceButtonsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  options,
}: ChoiceButtonsFieldProps<TFieldValues, TName>) => {
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
            cssOverride={styles.root}
          >
            {options.map((option) => {
              const optionId = `${String(name)}-${String(option.value)}`;

              return (
                <FieldLabel key={optionId} htmlFor={optionId} cssOverride={styles.choice}>
                  <RadioGroupItem
                    value={String(option.value)}
                    id={optionId}
                    cssOverride={styles.hiddenRadio}
                  />
                  {option.label}
                </FieldLabel>
              );
            })}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

ChoiceButtonsField.displayName = 'ChoiceButtonsField';

export default ChoiceButtonsField;

const styles = defineStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing[3],
  },
  choice: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '32px',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    cursor: 'pointer',
    // Same selector as FieldLabel's checked state, so this replaces its tinted fill
    // with the outlined look of the design.
    '&:has([data-state="checked"])': {
      borderColor: theme.colors.background.fillBrand,
      backgroundColor: theme.colors.background.surface,
      color: theme.colors.text.emphasis,
    },
    '&:focus-within': {
      ...uiFocusRing(theme),
    },
  },
  hiddenRadio: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 'none',
  },
});
