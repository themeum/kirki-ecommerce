import { z } from 'zod';

import { StateTaxRateSchema, TaxRuleSchema } from '@/features/settings/tax/schemas/catalog/tax';
import { isEmptyValue, prepareFormSchema, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

const isCentralOn = (values: Record<string, unknown>) => values.is_central_tax_enabled === true;

const TaxRegionGeneralFormShape = z.object({
  is_central_tax_enabled: z.boolean().default(true),
  central_product_tax: requiredWhen(
    z.union([z.number(), z.string()]).default(0),
    (values) => isCentralOn(values) && isEmptyValue(values.central_product_tax),
    __('This field is required', 'kirki-ecommerce'),
  ),
  central_shipping_tax: requiredWhen(
    z.union([z.number(), z.string()]).default(0),
    (values) => isCentralOn(values) && isEmptyValue(values.central_shipping_tax),
    __('This field is required', 'kirki-ecommerce'),
  ),
  states: requiredWhen(
    z.array(StateTaxRateSchema).default([]),
    (values) => !isCentralOn(values) && isEmptyValue(values.states),
    __('Add at least one state', 'kirki-ecommerce'),
  ),
  rules: z.array(TaxRuleSchema).default([]),
});

export const TaxRegionGeneralFormSchema = prepareFormSchema(TaxRegionGeneralFormShape).transform(
  (values) => {
    const central = values.is_central_tax_enabled;

    return {
      is_central_tax_enabled: central,
      central_product_tax: Number(values.central_product_tax) || 0,
      central_shipping_tax: Number(values.central_shipping_tax) || 0,
      states: central ? [] : (values.states ?? []),
      rules: values.rules ?? [],
    };
  },
);

export type TaxRegionGeneralFormInput = z.input<typeof TaxRegionGeneralFormSchema>;

export type TaxRegionGeneralFormPayload = z.output<typeof TaxRegionGeneralFormSchema>;
