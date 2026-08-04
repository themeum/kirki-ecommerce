import type { CSSObject } from '@emotion/react';
import { useMemo, type ReactNode } from 'react';
import { Controller, useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import MultiSelect, { type MultiSelectOption } from '@/components/ui/multi-select';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import { useCollectionsQuery, useCreateCollectionMutation } from '@/services/collection';
import { __ } from '@/wpi18n';

type CollectionRef = {
  id: number;
  title: string;
};

type CollectionsFieldProps<
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
 * Collection picker bound to react-hook-form. Owns the collection list,
 * inline collection creation and the mapping between the form's
 * `{ id, title }` refs and the multi-select's option shape.
 *
 * @param props Component props.
 *
 * @returns CollectionsField element.
 * @since 1.0.0
 */
const CollectionsField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder = __('Type to add collections..', 'kirki-ecommerce'),
  createLabel = __('Add Collection', 'kirki-ecommerce'),
  disabled,
  cssOverride,
}: CollectionsFieldProps<TFieldValues, TName>) => {
  const { control, setError, clearErrors } = useFormContext<TFieldValues>();
  const { data: collectionData } = useCollectionsQuery({ limit: -1 });
  const createCollectionMutation = useCreateCollectionMutation();

  const options: MultiSelectOption[] = useMemo(
    () =>
      (collectionData?.results ?? []).map((collection) => ({
        value: collection.id,
        title: collection.title,
      })),
    [collectionData],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedCollections = (field.value ?? []) as CollectionRef[];
        const selected: MultiSelectOption[] = selectedCollections.map(
          (collection) => ({
            value: collection.id,
            title: collection.title,
          }),
        );

        const handleChange = (next: MultiSelectOption[]) => {
          field.onChange(
            next.map((option) => ({
              id: Number(option.value),
              title: option.title,
            })),
          );
          clearErrors(name);
        };

        const handleCreate = async (title: string) => {
          try {
            const response = await createCollectionMutation.mutateAsync({
              title,
            });
            field.onChange([
              { id: response.data.id, title },
              ...selectedCollections,
            ]);
            clearErrors(name);
          } catch (error) {
            const fieldErrors = getErrorsObject((error as ErrorResponse).errors);
            if (fieldErrors.title) {
              setError(name, { message: String(fieldErrors.title) });
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

CollectionsField.displayName = 'CollectionsField';

export default CollectionsField;
