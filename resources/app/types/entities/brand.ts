import type { MediaRef } from '@/schemas/shared/media';

export type { Brand } from '@/schemas/catalog/brand';

type BrandFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
  logo?: MediaRef | string | number | null;
};

export type { BrandFormData };
