import type { CSSObject } from '@emotion/react';
import { PlusIcon } from 'lucide-react';
import {
  type FieldArrayPath,
  type FieldPath,
  type FieldValues,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import MoneyField from '@/components/form/money-field';
import NumberField from '@/components/form/number-field';
import Button from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import { TrashIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type WeightRangeFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = {
  name: TName;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

type RowErrorMessage = { message?: string } | undefined;

const WeightRangeField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
>({
  name,
  disabled,
  cssOverride,
}: WeightRangeFieldProps<TFieldValues, TName>) => {
  const { control, formState } = useFormContext<TFieldValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  const lastRangeTo = useWatch({
    control,
    name: `${name}.${fields.length - 1}.to` as FieldPath<TFieldValues>,
  });
  const isLastRangeUnbounded =
    lastRangeTo === null || lastRangeTo === undefined || lastRangeTo === '';

  const arrayError = (formState.errors as Record<string, unknown>)?.[name] as
    | RowErrorMessage
    | { from?: RowErrorMessage; to?: RowErrorMessage; base_amount?: RowErrorMessage }[]
    | undefined;
  const arrayLevelMessage = Array.isArray(arrayError) ? undefined : arrayError?.message;

  return (
    <Field cssOverride={cssOverride}>
      <Grid columns={3}>
        <Text variant="small">{__('Weight Range (kg)', 'kirki-ecommerce')}</Text>
        <Text variant="small" />
        <Text variant="small">{__('Rate', 'kirki-ecommerce')}</Text>
      </Grid>
      {fields.map((field, index) => {
        return (
          <Grid columns={3} align="start" key={field.id}>
            <NumberField
              placeholder={__('e.g. 0', 'kirki-ecommerce')}
              disabled={disabled}
              name={`${name}.${index}.from` as FieldPath<TFieldValues>}
              min={0}
            />
            <NumberField
              name={`${name}.${index}.to` as FieldPath<TFieldValues>}
              placeholder={__('No limit', 'kirki-ecommerce')}
              disabled={disabled}
            />
            <div css={scoped(styles.rateRow)} data-hover-parent>
              <MoneyField
                name={`${name}.${index}.base_amount` as FieldPath<TFieldValues>}
                placeholder={__('e.g. 15', 'kirki-ecommerce')}
                disabled={disabled}
              />
              {fields.length > 1 && (
                <Button
                  variant="secondary"
                  cssOverride={styles.deleteButton}
                  data-hover-reveal
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          </Grid>
        );
      })}
      <Button
        variant="ghost"
        disabled={disabled || (fields.length > 0 && isLastRangeUnbounded)}
        onClick={() => append({ from: null, to: null, base_amount: null } as never)}
      >
        <PlusIcon size={16} />
        {__('Add Another Range', 'kirki-ecommerce')}
      </Button>
      {arrayLevelMessage && <FieldError>{arrayLevelMessage}</FieldError>}
    </Field>
  );
};

WeightRangeField.displayName = 'WeightRangeField';

export default WeightRangeField;

const styles = defineStyles({
  rateRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing[4],
    '&:hover [data-hover-reveal]': {
      opacity: 1,
      visibility: 'visible',
      display: 'block',
    },
  },
  deleteButton: {
    padding: theme.spacing[1],
    opacity: 0,
    display: 'none',
    visibility: 'hidden',
    transition: 'opacity 0.2s ease',
    cursor: 'pointer',
    background: theme.colors.background.fillSecondary,
    borderRadius: theme.radius.lg,
  },
});
