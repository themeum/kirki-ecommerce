import type { MoneyObject } from '@/schemas/shared/api';

export type ProductVariantSelection = {
  variantId: number;
  variantLabel: string;
  thumbnail?: string | null;
  inStock: boolean;
  regularPrice: MoneyObject;
  salePrice?: MoneyObject | null;
};

export type ProductSelection = {
  productId: number;
  productTitle: string;
  thumbnail?: string | null;
  inStock: boolean;
  regularPrice: MoneyObject;
  salePrice?: MoneyObject | null;
  variants: ProductVariantSelection[];
};
