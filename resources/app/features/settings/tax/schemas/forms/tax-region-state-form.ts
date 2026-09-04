import { z } from 'zod';

import { TaxRuleSchema } from '@/features/settings/tax/schemas/catalog/tax';
import { prepareFormSchema } from '@/libs/zod';
import { isDefined } from '@/utils/object';

const TaxRegionStateFormShape = z.object({
  product_tax_rate: z.union([z.number(), z.string()]).nullish(),
  shipping_tax_rate: z.union([z.number(), z.string()]).nullish(),
  rules: z.array(TaxRuleSchema).default([]),
});

export const TaxRegionStateFormSchema = prepareFormSchema(TaxRegionStateFormShape).transform(
  (values) => ({
    product_tax_rate:
      isDefined(values.product_tax_rate) && values.product_tax_rate !== ''
        ? Number(values.product_tax_rate)
        : null,
    shipping_tax_rate:
      isDefined(values.shipping_tax_rate) && values.shipping_tax_rate !== ''
        ? Number(values.shipping_tax_rate)
        : null,
    rules: values.rules ?? [],
  }),
);

export type TaxRegionStateFormInput = z.input<typeof TaxRegionStateFormSchema>;

export type TaxRegionStateFormPayload = z.output<typeof TaxRegionStateFormSchema>;
