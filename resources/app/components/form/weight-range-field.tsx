import type { CSSObject } from '@emotion/react';
import { Controller, type FieldArrayPath, type FieldPath, type FieldValues, useFieldArray, useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Field, FieldError } from '@/components/ui/field';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { PlusIcon, TrashIcon } from '@/icons';
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

  const arrayError = (formState.errors as Record<string, unknown>)?.[name] as
    | RowErrorMessage
    | { from?: RowErrorMessage; to?: RowErrorMessage; base_amount?: RowErrorMessage }[]
    | undefined;
  const arrayLevelMessage = Array.isArray(arrayError) ? undefined : arrayError?.message;
  const rowErrorFor = (index: number) => (Array.isArray(arrayError) ? arrayError[index] : undefined);

  return (
    <Field cssOverride={cssOverride}>
      <Grid columns={3}>
        <Text variant="small">{__('Weight Range (kg)', 'kirki-ecommerce')}</Text>
        <Text variant="small" />
        <Text variant="small">{__('Rate', 'kirki-ecommerce')}</Text>
      </Grid>
      {fields.map((field, index) => {
        const rowError = rowErrorFor(index);

        return (
          <Grid columns={3} key={field.id}>
            <Controller
              control={control}
              name={`${name}.${index}.from` as FieldPath<TFieldValues>}
              render={({ field: fromField, fieldState }) => (
                <Input
                  value={(fromField.value) ?? ''}
                  type="number"
                  placeholder={__('e.g. 0', 'kirki-ecommerce')}
                  disabled={disabled}
                  error={Boolean(fieldState.error)}
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => fromField.onChange(event.target.value === '' ? null : event.target.value)}
                  onBlur={fromField.onBlur}
                  ref={fromField.ref}
                />
              )}
            />
            <Controller
              control={control}
              name={`${name}.${index}.to` as FieldPath<TFieldValues>}
              render={({ field: toField, fieldState }) => (
                <Input
                  value={(toField.value) ?? ''}
                  type="number"
                  placeholder={__('e.g. 10', 'kirki-ecommerce')}
                  disabled={disabled}
                  error={Boolean(fieldState.error)}
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => toField.onChange(event.target.value === '' ? null : event.target.value)}
                  onBlur={toField.onBlur}
                  ref={toField.ref}
                />
              )}
            />
            <div css={scoped(styles.rateRow)} data-hover-parent>
              <Controller
                control={control}
                name={`${name}.${index}.base_amount` as FieldPath<TFieldValues>}
                render={({ field: amountField, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <Input
                      value={(amountField.value) ?? ''}
                      type="number"
                      placeholder={__('e.g. 15', 'kirki-ecommerce')}
                      disabled={disabled}
                      error={Boolean(fieldState.error)}
                      aria-invalid={fieldState.invalid}
                      onChange={(event) => amountField.onChange(event.target.value === '' ? null : event.target.value)}
                      onBlur={amountField.onBlur}
                      ref={amountField.ref}
                    />
                    {fieldState.invalid && <FieldError>{rowError?.base_amount?.message}</FieldError>}
                  </Field>
                )}
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
        disabled={disabled}
        onClick={() => append({ from: null, to: null, base_amount: null } as never)}
      >
        <PlusIcon />
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
