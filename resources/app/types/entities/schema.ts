type SchemaProfile = {
  id: number;
  name: string;
  is_default?: boolean;
  schema: Record<string, string[]>;
};

type SchemaFormData = {
  name?: string;
  is_default?: boolean;
  schema?: Record<string, string[]>;
};

export type { SchemaProfile, SchemaFormData };
