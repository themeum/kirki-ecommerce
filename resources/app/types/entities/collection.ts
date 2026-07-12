import type { MediaRef } from './media';

type Collection = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  count?: number;
  created_at?: string;
  banner?: MediaRef | string | number | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

type CollectionFormData = {
  title?: string;
  slug?: string;
  description?: string | null;
  banner?: MediaRef | string | number | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type { Collection, CollectionFormData };
