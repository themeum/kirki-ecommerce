import type { MediaRef } from './media';

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  image?: MediaRef | number | null;
  parent_id?: number | null;
  is_active?: number | boolean;
};

type CategoryFormData = {
  name?: string;
  slug?: string;
  description?: string;
  image?: MediaRef | number | null;
  parent_id?: number | null;
  is_active?: number | boolean;
  [key: string]: unknown;
};

export type { Category, CategoryFormData };
