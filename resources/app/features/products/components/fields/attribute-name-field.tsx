import type { ReactNode } from 'react';
import { Controller, useFormContext, useFormState, useWatch } from 'react-hook-form';

import Combobox from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import type { AddVariationFormPayload } from '@/features/products/schemas/forms/add-variation-form';
import type { ProductAttributeFormInput } from '@/features/products/schemas/forms/product-attribute-form';
import { useCreateAttributeMutation } from '@/features/products/services/attribute';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import type { SelectOption } from '@/types/components/common';

type AttributeSuggestion = SelectOption & {
  type?: string;
};

type AttributeNameFieldProps = {
  label?: ReactNode;
  suggestions: AttributeSuggestion[];
  placeholder?: string;
  searchPlaceholder?: string;
  addItemLabel?: string;
};

/**
 * Creatable combobox for picking the attribute a variation is built from.
 *
 * Binds the attribute `id`, and carries the writes that selection implies —
 * the attribute's `name`, its `type`, and a cleared value list — since an
 * attribute is only ever chosen as a whole. Creating an attribute inline
 * resets the form onto the newly created record.
 *
 * @param props Component props.
 *
 * @returns AttributeNameField element.
 */
const AttributeNameField = ({
  label,
  suggestions,
  placeholder,
  searchPlaceholder,
  addItemLabel,
}: AttributeNameFieldProps) => {
  const form = useFormContext<ProductAttributeFormInput>();
  const { control, setValue, clearErrors, reset } = form;
  const createAttributeMutation = useCreateAttributeMutation();

  const type = useWatch({ control, name: 'type' }) ?? 'list';
  const selectedName = useWatch({ control, name: 'name' });

  // `id` and `name` are written together, so either can carry the message for
  // this control. Subscribing to both keeps the error visible whichever the
  // resolver or the server reports.
  const { errors } = useFormState({ control, name: ['id', 'name'] });
  const error = errors.name ?? errors.id;

  const handleNewAttributeAdd = async (value: string) => {
    const newAttribute: AddVariationFormPayload = {
      name: value,
      type,
    };
    try {
      const response = await createAttributeMutation.mutateAsync(newAttribute);
      const attributeData = response.data as Attribute & { slug?: string };
      const { id, name, slug, type: attrType, values } = attributeData;
      reset({
        id,
        name,
        slug,
        type: attrType,
        values: values ?? [],
      });
    } catch (serverError) {
      applyServerErrors(form, serverError as ErrorResponse);
    }
  };

  return (
    <Controller
      control={control}
      name="id"
      render={({ field }) => {
        const selectedId = field.value != null ? String(field.value) : undefined;

        const handleAttributeSelect = (attributeValue: string) => {
          const selected = suggestions.find(
            (item) => String(item.value) === attributeValue,
          );
          if (!selected) {
            return;
          }

          field.onChange(Number(selected.value));
          setValue('name', selected.title, { shouldDirty: true });
          setValue('type', type, { shouldDirty: true });
          setValue('values', [], { shouldDirty: true });
          clearErrors(['id', 'name']);
        };

        return (
          <Field data-invalid={Boolean(error) || undefined}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <Combobox
              error={Boolean(error)}
              value={selectedId}
              options={[
                ...(selectedId && selectedName
                  ? [{ label: selectedName, value: selectedId }]
                  : []),
                ...suggestions
                  .filter((item) => String(item.value) !== selectedId)
                  .map((item) => ({
                    label: item.title,
                    value: String(item.value),
                  })),
              ]}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              creatable
              addItemLabel={addItemLabel}
              onChange={(nextValue) =>
                handleAttributeSelect(String(nextValue))
              }
              onAddItem={(query) => handleNewAttributeAdd(query)}
              disabled={Boolean(field.value)}
            />
            {Boolean(error) && <FieldError errors={[error]} />}
          </Field>
        );
      }}
    />
  );
};

AttributeNameField.displayName = 'AttributeNameField';

export default AttributeNameField;
export type { AttributeSuggestion };
