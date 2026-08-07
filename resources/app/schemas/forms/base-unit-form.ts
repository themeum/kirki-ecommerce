import { z } from 'zod';

import { pickFormValues } from '@/libs/zod';
import { moneyAmount } from '@/schemas/forms/shared/validators';
import type { ProductVariant } from '@/types';

const BaseUnitFormShape = z.object({
  total_unit_amount: moneyAmount.nullish().default(null),
  total_unit: z.string().nullish().default(null),
  base_unit_amount: moneyAmount.nullish().default(null),
  base_unit: z.string().nullish().default(null),
  base_price: moneyAmount.nullish().default(null),
});

/**
 * This form never reaches an HTTP endpoint — its output is written into the
 * parent product form's `variants.0.*` fields via `setValue`, so the
 * transform stays a pass-through named per field rather than a payload
 * reshape.
 */
export const BaseUnitFormSchema = BaseUnitFormShape.transform((values) => ({
  total_unit_amount: values.total_unit_amount ?? null,
  total_unit: values.total_unit ?? null,
  base_unit_amount: values.base_unit_amount ?? null,
  base_unit: values.base_unit ?? null,
  base_price: values.base_price ?? null,
}));

export type BaseUnitFormInput = z.input<typeof BaseUnitFormSchema>;

export type BaseUnitFormPayload = z.output<typeof BaseUnitFormSchema>;

export const mapBaseUnitFromVariant = (data?: ProductVariant): BaseUnitFormInput =>
  pickFormValues(BaseUnitFormSchema, data ?? {});
