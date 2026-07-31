import { Controller, useFormContext } from 'react-hook-form';

import GroupTagTable from '@/components/group-tag-table';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SchemaPreview from '@/pages/products/edit-product/seo-settings/schema-preview';
import { groupDetails } from '@/pages/products/edit-product/seo-settings/utils';
import type { ProductSeoFormValues } from '@/schemas/forms/product-seo-form';
import { useSchemasQuery } from '@/services/schema';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, Array<string | number>>;

const Schema = () => {
  const { control, watch } = useFormContext<ProductSeoFormValues>();
  const { data: schemas = [], isLoading } = useSchemasQuery({ limit: -1 });
  const schemaId = watch('schema_id');

  const hasProfiles = schemas.length > 0;
  const defaultProfile = schemas.find((item) => item.is_default) ?? schemas[0];
  const resolvedSchemaId =
    schemaId !== null && schemaId !== undefined && schemaId !== ''
      ? Number(schemaId)
      : defaultProfile?.id ?? null;

  const activeProfile =
    schemas.find((item) => item.id === resolvedSchemaId) ?? null;

  const selectedValues: GroupedValues = activeProfile?.schema
    ? Object.fromEntries(
        Object.entries(activeProfile.schema).map(([group, fields]) => [
          group,
          fields,
        ]),
      )
    : {};

  const schemaOptions = schemas.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  const displayValue =
    resolvedSchemaId !== null ? String(resolvedSchemaId) : '';

  return (
    <Flex direction="column" gap={4}>
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
                  placeholder={__(
                    'Select a schema',
                    'kirki-ecommerce',
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {schemaOptions.map((option) => (
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
          </Field>
        )}
      />
      {Object.keys(selectedValues).length > 0 ? (
        <GroupTagTable
          groupDetails={groupDetails}
          selectedValues={selectedValues}
          hasSelect={false}
          isEditable={false}
        />
      ) : null}
      <SchemaPreview />
    </Flex>
  );
};

Schema.displayName = 'Schema';

export default Schema;
