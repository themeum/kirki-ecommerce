import { useFormContext } from 'react-hook-form';

import GroupTagTable from '@/components/group-tag-table';
import Flex from '@/components/ui/flex';
import SchemaSelectField from '@/features/products/components/fields/schema-select-field';
import SchemaPreview from '@/features/products/components/product-form/sections/seo-settings/schema-preview';
import { groupDetails } from '@/features/products/lib/seo-settings/utils';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { useSchemasQuery } from '@/features/settings';
import { __ } from '@/wpi18n';

type GroupedValues = Record<string, (string | number)[]>;

const Schema = () => {
  const { watch } = useFormContext<ProductFormInput>();
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

  return (
    <Flex direction="column" gap={4}>
      <SchemaSelectField
        options={schemaOptions}
        resolvedSchemaId={resolvedSchemaId}
        hasProfiles={hasProfiles}
        isLoading={isLoading}
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
