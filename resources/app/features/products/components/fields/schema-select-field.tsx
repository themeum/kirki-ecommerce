import { Controller, useFormContext } from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { __ } from '@/wpi18n';

type SchemaSelectFieldProps = {
  /** Profiles already loaded by the parent, so the read-only tag table and this select agree. */
  options: { value: string; label: string }[];
  /**
   * Profile shown when `schema_id` is empty. The form value deliberately stays
   * null until the merchant picks one — see the product-seo-card spec scenario
   * "Default profile display without persisting".
   */
  resolvedSchemaId: number | null;
  hasProfiles: boolean;
  isLoading: boolean;
};

const SchemaSelectField = ({
  options,
  resolvedSchemaId,
  hasProfiles,
  isLoading,
}: SchemaSelectFieldProps) => {
  const { control } = useFormContext<ProductFormInput>();
  const displayValue = resolvedSchemaId !== null ? String(resolvedSchemaId) : '';

  return (
    <Controller
      control={control}
      name="schema_id"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor="schema_id">
            {__('Schema', 'kirki-ecommerce')}
          </FieldLabel>
          <Select
            value={displayValue}
            onValueChange={(nextValue) => {
              field.onChange(nextValue === '' ? null : Number(nextValue));
            }}
            disabled={!hasProfiles || isLoading}
          >
            <SelectTrigger
              id="schema_id"
              error={Boolean(fieldState.error)}
              aria-invalid={fieldState.invalid}
            >
              <SelectValue
                placeholder={__('Select a schema', 'kirki-ecommerce')}
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasProfiles && !isLoading ? (
            <FieldDescription>
              {__(
                'No schema profiles — create one in Settings → Essentials',
                'kirki-ecommerce',
              )}
            </FieldDescription>
          ) : null}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

SchemaSelectField.displayName = 'SchemaSelectField';

export default SchemaSelectField;
