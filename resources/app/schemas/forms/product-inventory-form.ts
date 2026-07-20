import { z } from 'zod';

import { optionalNullableString } from '@/schemas/forms/shared/validators';
import type { Product } from '@/types';

export const ProductInventoryFormSchema = z.object({
  track_inventory: z.boolean().optional(),
  available_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  committed_quantity: z.union([z.number(), z.string()]).optional().nullable(),
  in_stock: z.union([z.boolean(), z.string()]).optional(),
  sku: optionalNullableString(),
  has_limit_per_order: z.boolean().optional(),
  max_per_order: z.union([z.number(), z.string()]).optional().nullable(),
});

export type ProductInventoryFormValues = z.infer<
  typeof ProductInventoryFormSchema
>;

export const mapProductInventoryFromProduct = (
  product: Product,
): ProductInventoryFormValues => {
  const variant = product.variants[0];

  return {
    track_inventory: variant?.track_inventory ?? false,
    available_quantity: variant?.available_quantity ?? 0,
    committed_quantity: variant?.committed_quantity ?? 0,
    in_stock:
      variant?.in_stock === undefined || variant?.in_stock === null
        ? 'true'
        : String(variant.in_stock),
    sku: variant?.sku ?? '',
    has_limit_per_order: product.has_limit_per_order ?? false,
    max_per_order: product.max_per_order ?? 1,
  };
};

export const productInventoryDefaultValues: ProductInventoryFormValues = {
  track_inventory: false,
  available_quantity: 0,
  committed_quantity: 0,
  in_stock: 'true',
  sku: '',
  has_limit_per_order: true,
  max_per_order: 1,
};
