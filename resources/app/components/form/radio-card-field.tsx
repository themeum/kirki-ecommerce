import type { CSSObject } from '@emotion/react';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, uiFocusRing } from '@/theme/mixins';

type RadioCardFieldOption = {
  label: string;
  value: string;
  icon?: ReactNode;
};

type RadioCardFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  options: RadioCardFieldOption[];
  columns?: number;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const RadioCardField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  options,
  columns = 3,
  disabled,
  cssOverride,
}: RadioCardFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
          {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
          <RadioGroup
            value={field.value ?? ''}
            onValueChange={field.onChange}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            cssOverride={{
              ...styles.root,
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
            }}
          >
            {options.map((option) => {
              const optionId = `${String(name)}-${option.value}`;
              const isSelected = field.value === option.value;

              return (
                <FieldLabel key={option.value} htmlFor={optionId} cssOverride={styles.card}>
                  <RadioGroupItem
                    value={option.value}
                    id={optionId}
                    cssOverride={styles.hiddenRadio}
                  />
                  {isSelected && (
                    <span css={styles.checkBadge} aria-hidden="true">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                  <Field orientation="vertical" cssOverride={styles.cardField}>
                    {option.icon && <span css={styles.iconBadge}>{option.icon}</span>}
                    <Text variant="small" weight="medium">{option.label}</Text>
                  </Field>
                </FieldLabel>
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

RadioCardField.displayName = 'RadioCardField';

export default RadioCardField;
export type { RadioCardFieldOption };

const styles = defineStyles({
  root: {
    display: 'grid',
    gap: theme.spacing[3],
  },
  card: {
    position: 'relative',
    cursor: 'pointer',
    '&:focus-within': {
      ...uiFocusRing(theme),
    },
  },
  cardField: {
    alignItems: 'center',
    gap: theme.spacing[3],
    textAlign: 'center',
    padding: `${theme.spacing[6]} !important`,
  },
  iconBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    color: theme.colors.icon.primary,
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
  checkBadge: {
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillBrand,
    color: theme.colors.text.light,
  },
});
