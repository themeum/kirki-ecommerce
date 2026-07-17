import type { MediaRef } from '@/schemas/shared/media';

export type { Category } from '@/schemas/catalog/category';

type CategoryFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: MediaRef | string | number | null;
  parent_id?: number | null;
  is_active?: boolean;
};

export type { CategoryFormData };
