export type { SchemaProfile } from '@/schemas/catalog/schema-profile';

type SchemaFormData = {
  name?: string;
  is_default?: boolean;
  schema?: Record<string, string[]>;
};

export type { SchemaFormData };
