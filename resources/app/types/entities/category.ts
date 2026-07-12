import type { MediaRef } from './media';

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  count?: number;
  image?: MediaRef | string | number | null;
  parent_id?: number | null;
  level?: number;
  ordering?: number;
  is_active?: boolean;
  is_deletable?: boolean;
  created_at?: string;
  updated_at?: string;
};

type CategoryFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: MediaRef | string | number | null;
  parent_id?: number | null;
  is_active?: boolean;
};

export type { Category, CategoryFormData };
