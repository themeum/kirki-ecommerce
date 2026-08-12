import type { CSSObject } from '@emotion/react';
import { type ReactNode, useMemo } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import { type ErrorResponse, getErrorsObject } from '@/libs/api';
import { useCreateTagMutation, useTagsQuery } from '@/services/tag';
import { __ } from '@/wpi18n';

type TagRef = {
  id: number;
  name: string;
};

type TagsFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  createLabel?: string;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

/**
 * Tag picker bound to react-hook-form. Owns the tag list, inline tag
 * creation and the mapping between the form's `{ id, name }` refs and the
 * multi-select's option shape.
 *
 * @param props Component props.
 *
 * @returns TagsField element.
 * @since 1.0.0
 */
const TagsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder = __('Type to add tags..', 'kirki-ecommerce'),
  createLabel = __('Add Tag', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: TagsFieldProps<TFieldValues, TName>) => {
  const { control, setError, clearErrors } = useFormContext<TFieldValues>();
  const { data: tagData } = useTagsQuery({ limit: -1 });
  const createTagMutation = useCreateTagMutation();

  const options: MultiSelectOption[] = useMemo(
    () =>
      (tagData?.results ?? []).map((tag) => ({
        value: tag.id,
        title: tag.name,
      })),
    [tagData],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedTags = (field.value ?? []) as TagRef[];
        const selected: MultiSelectOption[] = selectedTags.map((tag) => ({
          value: tag.id,
          title: tag.name,
        }));

        const handleChange = (next: MultiSelectOption[]) => {
          field.onChange(
            next.map((option) => ({
              id: Number(option.value),
              name: option.title,
            })),
          );
          clearErrors(name);
        };

        const handleCreate = async (title: string) => {
          try {
            const response = await createTagMutation.mutateAsync({
              name: title,
            });
            field.onChange([
              { id: response.data.id, name: title },
              ...selectedTags,
            ]);
            clearErrors(name);
          } catch (error) {
            const fieldErrors = getErrorsObject((error as ErrorResponse).errors);
            if (fieldErrors.name) {
              setError(name, { message: String(fieldErrors.name) });
            }
            // Rethrown so the popover stays open with the typed text intact.
            throw error;
          }
        };

        return (
          <Field
            data-invalid={fieldState.invalid || undefined}
            cssOverride={cssOverride}
          >
            {label && <FieldLabel infoText={infoText}>{label}</FieldLabel>}
            <MultiSelect
              options={options}
              value={selected}
              onChange={handleChange}
              onCreate={handleCreate}
              createLabel={createLabel}
              placeholder={placeholder}
              disabled={disabled}
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

TagsField.displayName = 'TagsField';

export default TagsField;
