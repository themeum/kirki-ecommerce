import type { z } from 'zod';

import { VariantFieldsShape } from '@/features/products/schemas/forms/variant-fields';
import { prepareFormSchema } from '@/libs/zod';

const VariantFormSchema = prepareFormSchema(VariantFieldsShape).transform((values) => ({
  id: values.id,
  media: values.media,
  sku: values.sku || null,
  base_price: values.base_price ?? null,
  base_unit: values.base_unit || null,
  base_unit_amount: values.base_unit_amount ?? null,
  total_unit: values.total_unit || null,
  total_unit_amount: values.total_unit_amount ?? null,
  base_sale_price: values.base_sale_price ?? null,
  base_cost_of_goods: values.base_cost_of_goods ?? null,
  weight: values.weight ?? null,
  weight_unit: values.weight_unit || null,
  charge_taxes: values.charge_taxes ?? true,
  allow_back_order: values.allow_back_order ?? false,
  track_inventory: values.track_inventory ?? false,
  available_quantity: values.available_quantity ?? 0,
  in_stock: values.in_stock,
  low_stock_threshold: values.low_stock_threshold,
  has_limit_per_order: values.has_limit_per_order ?? false,
  max_per_order: values.max_per_order,
  tax_profile_id: values.tax_profile_id,
  shipping_profile_id: values.shipping_profile_id,
  shipping_box_id: values.shipping_box_id,
  is_visible: values.is_visible ?? true,
  is_physical_product: values.is_physical_product ?? true,
}));

type VariantFormInput = z.input<typeof VariantFormSchema>;
type VariantFormPayload = z.output<typeof VariantFormSchema>;

export { type VariantFormInput, type VariantFormPayload, VariantFormSchema };
