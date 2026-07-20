import { z } from 'zod';

import { moneyAmount } from '@/schemas/forms/shared/validators';
import type { Product } from '@/types';

export const ProductPriceFormSchema = z.object({
  price: moneyAmount.nullable().optional(),
  sale_price: moneyAmount.nullable().optional(),
  show_unit_price: z.boolean().optional().nullable(),
  charge_taxes: z.boolean().optional(),
  tax_profile_id: z.union([z.number(), z.string(), z.null()]).optional(),
  cost_of_goods: moneyAmount.nullable().optional(),
});

export type ProductPriceFormValues = z.infer<typeof ProductPriceFormSchema>;

export const mapProductPriceFromProduct = (
  product: Product,
): ProductPriceFormValues => {
  const variant = product.variants[0];

  return {
    price: variant?.price ?? null,
    sale_price: variant?.sale_price ?? null,
    show_unit_price: variant?.show_unit_price ?? false,
    charge_taxes: variant?.charge_taxes ?? false,
    tax_profile_id: variant?.tax_profile_id ?? null,
    cost_of_goods: variant?.cost_of_goods ?? null,
  };
};

export const productPriceDefaultValues: ProductPriceFormValues = {
  price: null,
  sale_price: null,
  show_unit_price: false,
  charge_taxes: true,
  tax_profile_id: null,
  cost_of_goods: null,
};
