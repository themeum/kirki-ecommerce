type Tag = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  count?: number;
};

type TagFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
};

export type { Tag, TagFormData };
