import type { MediaRef } from './media';

type Collection = {
  id: number;
  title: string;
  slug: string;
  description?: string;
  count?: number;
  created_at?: string;
  banner?: MediaRef | number | null;
};

type CollectionFormData = {
  title?: string;
  slug?: string;
  description?: string;
  banner?: MediaRef | number | null;
  [key: string]: unknown;
};

export type { Collection, CollectionFormData };
