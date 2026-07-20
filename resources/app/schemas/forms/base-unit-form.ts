import { z } from 'zod';

import { moneyAmount } from '@/schemas/forms/shared/validators';
import type { ProductVariant, UnitPriceValue } from '@/types';

export const BaseUnitFormSchema = z.object({
  total_unit_amount: moneyAmount.nullable().optional(),
  total_unit: z.string().nullable().optional(),
  base_unit_amount: moneyAmount.nullable().optional(),
  base_unit: z.string().nullable().optional(),
  price: moneyAmount.nullable().optional(),
});

export type BaseUnitFormValues = z.infer<typeof BaseUnitFormSchema>;

export const mapBaseUnitFromVariant = (
  data?: ProductVariant,
): BaseUnitFormValues => ({
  total_unit_amount: data?.total_unit_amount ?? null,
  total_unit: data?.total_unit ?? null,
  base_unit_amount: data?.base_unit_amount ?? null,
  base_unit: data?.base_unit ?? null,
  price: data?.price ?? null,
});

export const toUnitPriceValue = (
  values: BaseUnitFormValues,
): UnitPriceValue & { price?: number | string | null } => ({
  total_unit_amount: values.total_unit_amount,
  total_unit: values.total_unit,
  base_unit_amount: values.base_unit_amount,
  base_unit: values.base_unit,
  price: values.price,
});
