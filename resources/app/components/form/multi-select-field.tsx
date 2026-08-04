import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import MultiSelect, { type MultiSelectOption, type MultiSelectProps } from '@/components/ui/multi-select';

type MultiSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TOption extends MultiSelectOption = MultiSelectOption,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  cssOverride?: CSSObject;
  /**
   * `options` (default) keeps the field value as option objects. `strings`
   * stores a plain `string[]`, mapping each entry to and from an option
   * whose value and title are that string.
   */
  valueAs?: 'options' | 'strings';
  /**
   * Offers the typed text as a new entry and appends it to the selection —
   * free-text entry against a fixed or empty option list. Ignored when an
   * `onCreate` of your own is supplied.
   */
  creatable?: boolean;
} & Omit<MultiSelectProps<TOption>, 'value' | 'onChange' | 'error'>;

/**
 * Generic multi-select bound to react-hook-form, for option lists the
 * caller already has. Domain-specific pickers that fetch their own options
 * (TagsField, CollectionsField, AttributeValuesField) live alongside this.
 *
 * @param props Component props.
 *
 * @returns MultiSelectField element.
 * @since 1.0.0
 */
const MultiSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TOption extends MultiSelectOption = MultiSelectOption,
>({
  name,
  label,
  description,
  infoText,
  cssOverride,
  valueAs = 'options',
  creatable = false,
  onCreate,
  ...multiSelectProps
}: MultiSelectFieldProps<TFieldValues, TName, TOption>) => {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const rawValue = Array.isArray(field.value) ? field.value : [];
        const selected = (
          valueAs === 'strings'
            ? rawValue.map((item: string) => ({ value: item, title: item }))
            : rawValue
        ) as TOption[];

        const handleChange = (next: TOption[]) => {
          field.onChange(
            valueAs === 'strings'
              ? next.map((option) => String(option.value))
              : next,
          );
        };

        const handleCreate =
          onCreate ??
          (creatable
            ? (query: string) => {
              field.onChange(
                valueAs === 'strings'
                  ? [...rawValue, query]
                  : [...rawValue, { value: query, title: query }],
              );
            }
            : undefined);

        return (
          <Field
            data-invalid={fieldState.invalid || undefined}
            cssOverride={cssOverride}
          >
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <MultiSelect
              {...multiSelectProps}
              value={selected}
              onChange={handleChange}
              onCreate={handleCreate}
              error={Boolean(fieldState.error)}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

MultiSelectField.displayName = 'MultiSelectField';

export default MultiSelectField;
export type { MultiSelectFieldProps };
