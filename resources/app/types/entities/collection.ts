import type { MediaRef } from '@/schemas/shared/media';

export type { Collection } from '@/schemas/catalog/collection';

type CollectionFormData = {
  title?: string;
  slug?: string;
  description?: string | null;
  banner?: MediaRef | string | number | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type { CollectionFormData };
