type Tag = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
};

type TagFormData = {
  name?: string;
  slug?: string;
  description?: string;
  [key: string]: unknown;
};

export type { Tag, TagFormData };
