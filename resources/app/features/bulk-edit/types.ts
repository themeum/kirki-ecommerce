import type { ProductVariant } from '@/features/products';

type BulkEditFormValues = {
  variants: ProductVariant[];
};

type BulkEditProfileOption = {
  label: string;
  value: number;
};

export type { BulkEditFormValues, BulkEditProfileOption };
