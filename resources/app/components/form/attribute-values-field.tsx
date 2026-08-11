import { type ReactNode, useMemo, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import { type AttributeValueOption, getAttributeValueType } from '@/components/form/attribute-value-types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import MultiSelect from '@/components/ui/multi-select';
import { type ErrorResponse, getErrorsObject } from '@/libs/api';
import VariationDialog from '@/pages/products/product-form/sections/variants/variation-dialog';
import type { ProductVariationPopoverFormPayload } from '@/schemas/forms/product-variation-popover-form';
import type { VariationValueFormPayload } from '@/schemas/forms/variation-value-form';
import { useAttributesQuery, useCreateAttributeValueMutation } from '@/services/attribute';
import type { Attribute } from '@/types';
import { __ } from '@/wpi18n';

type AttributeValueRef = {
  value?: number | string;
  title?: string;
  color?: string | null;
};

type AttributeValuesFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  attributeId?: number;
  type?: string | null;
  disabled?: boolean;
  placeholder?: string;
  addItemLabel?: string;
};

/**
 * Multi-select for a product attribute's values. Resolves its option list
 * from the attribute matching `attributeId` and creates new values inline,
 * delegating per-type presentation and creation to the attribute value type
 * registry.
 *
 * @param props Component props.
 *
 * @returns AttributeValuesField element.
 * @since 1.0.0
 */
const AttributeValuesField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  attributeId,
  type,
  disabled = false,
  placeholder,
  addItemLabel = __('Add item', 'kirki-ecommerce'),
}: AttributeValuesFieldProps<TFieldValues, TName>) => {
  const { control, setError, clearErrors } = useFormContext<TFieldValues>();
  const { data: allAttributesList } = useAttributesQuery({ limit: -1 });
  const createAttributeValueMutation = useCreateAttributeValueMutation();
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<ProductVariationPopoverFormPayload | null>(null);

  const valueType = getAttributeValueType(type);

  const currentAttribute = useMemo(
    () =>
      (allAttributesList as Attribute[] | null)?.find(
        (item) => item?.id === attributeId,
      ),
    [allAttributesList, attributeId],
  );

  const options: AttributeValueOption[] = useMemo(
    () =>
      (currentAttribute?.values ?? []).map((item) => ({
        value: item.id,
        title: item.value,
        color: item.color,
      })),
    [currentAttribute],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldValue = (field.value ?? []) as AttributeValueRef[];
        const selected: AttributeValueOption[] = fieldValue
          .filter((item) => item.value != null)
          .map((item) => ({
            value: item.value!,
            title: item.title ?? '',
            color: item.color,
          }));

        const handleChange = (next: AttributeValueOption[]) => {
          field.onChange(
            next.map((option) => ({
              value: Number(option.value),
              title: option.title,
              color: option.color,
            })),
          );
          clearErrors(name);
        };

        const addCreatedValue = (created: AttributeValueRef) => {
          field.onChange([created, ...fieldValue]);
          clearErrors(name);
        };

        const createValue = async (value: string, color?: string) => {
          if (!attributeId) {
            return;
          }

          const newValue: VariationValueFormPayload = {
            attribute_id: attributeId,
            value,
            color: color ?? null,
            value_id: undefined,
          };

          try {
            const response =
              await createAttributeValueMutation.mutateAsync(newValue);
            const resultData = response.data;
            addCreatedValue({
              value: resultData.id,
              title: resultData.value,
              color: resultData.color,
            });
          } catch (error) {
            const fieldErrors = getErrorsObject(
              (error as ErrorResponse).errors,
            );
            if (fieldErrors.value) {
              setError(name, { message: String(fieldErrors.value) });
            }
            throw error;
          }
        };

        // `dialog` types need more than the typed text, so the create action
        // hands off to the editor and resolves immediately.
        const handleCreate = (query: string) => {
          if (valueType.createVia === 'dialog') {
            setColorDialogOpen(true);
            setInitialValues({
              title: query,
              color: '',
            } as ProductVariationPopoverFormPayload);
            return;
          }

          return createValue(query);
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            {label && <FieldLabel>{label}</FieldLabel>}
            <MultiSelect
              options={options}
              value={selected}
              onChange={handleChange}
              onCreate={handleCreate}
              createLabel={addItemLabel}
              placeholder={placeholder}
              disabled={disabled}
              error={Boolean(fieldState.error)}
              renderOption={valueType.renderOption}
              renderChip={valueType.renderChip}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            <VariationDialog
              isOpen={colorDialogOpen}
              onClose={() => setColorDialogOpen(false)}
              initialValues={initialValues}
              onSave={(variation) => {
                void createValue(variation.title, variation.color).catch(
                  () => { },
                );
                setColorDialogOpen(false);
              }}
            />
          </Field>
        );
      }}
    />
  );
};

AttributeValuesField.displayName = 'AttributeValuesField';

export default AttributeValuesField;
