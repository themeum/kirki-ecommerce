import { z } from 'zod';

import { moneyAmount } from '@/schemas/forms/shared/validators';
import type { Product } from '@/types';

export const ProductShippingFormSchema = z.object({
  weight: moneyAmount.nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  shipping_box_id: z.union([z.number(), z.string(), z.null()]).optional(),
  shipping_profile_id: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type ProductShippingFormValues = z.infer<
  typeof ProductShippingFormSchema
>;

export const mapProductShippingFromProduct = (
  product: Product,
): ProductShippingFormValues => {
  const variant = product.variants[0];

  return {
    weight: variant?.weight ?? null,
    weight_unit: variant?.weight_unit ?? '',
    shipping_box_id: variant?.shipping_box_id ?? null,
    shipping_profile_id: variant?.shipping_profile_id ?? null,
  };
};

export const productShippingDefaultValues: ProductShippingFormValues = {
  weight: null,
  weight_unit: '',
  shipping_box_id: null,
  shipping_profile_id: null,
};
