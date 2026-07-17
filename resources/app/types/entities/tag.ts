export type { Tag } from '@/schemas/catalog/tag';

type TagFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export type { TagFormData };
