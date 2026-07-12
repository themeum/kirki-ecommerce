import type { MediaRef } from '@/types/entities/media';

type Brand = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  count?: number;
  logo?: MediaRef | string | number | null;
};

type BrandFormData = {
  name?: string;
  slug?: string;
  description?: string | null;
  logo?: MediaRef | string | number | null;
};

export type { Brand, BrandFormData };
