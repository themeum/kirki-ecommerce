import type { MediaRef } from './media';

type Brand = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
  logo?: MediaRef | number | null;
};

type BrandFormData = {
  name?: string;
  slug?: string;
  description?: string;
  logo?: MediaRef | number | null;
  [key: string]: unknown;
};

export type { Brand, BrandFormData };
