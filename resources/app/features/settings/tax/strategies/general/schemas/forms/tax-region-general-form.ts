import { z } from 'zod';

import { StateTaxRateSchema, TaxRuleSchema } from '@/features/settings/tax/shared/schemas/catalog/tax';
import { isEmptyValue, prepareFormSchema, requiredWhen } from '@/libs/zod';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const isCentralOn = (values: Record<string, unknown>) => values.is_central_tax_enabled === true;

const TaxRegionGeneralFormShape = z.object({
  is_central_tax_enabled: z.boolean().default(true),
  central_product_tax: z.union([z.number(), z.string()]).nullish(),
  central_shipping_tax: z.union([z.number(), z.string()]).nullish(),
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
      central_product_tax:
        isDefined(values.central_product_tax) && values.central_product_tax !== ''
          ? Number(values.central_product_tax)
          : null,
      central_shipping_tax:
        isDefined(values.central_shipping_tax) && values.central_shipping_tax !== ''
          ? Number(values.central_shipping_tax)
          : null,
      states: central ? [] : (values.states ?? []),
      rules: values.rules ?? [],
    };
  },
);

export type TaxRegionGeneralFormInput = z.input<typeof TaxRegionGeneralFormSchema>;

export type TaxRegionGeneralFormPayload = z.output<typeof TaxRegionGeneralFormSchema>;
