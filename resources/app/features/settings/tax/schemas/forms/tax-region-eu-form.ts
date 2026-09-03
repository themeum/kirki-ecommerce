import { z } from 'zod';

import { CountryTaxRateSchema } from '@/features/settings/tax/schemas/catalog/tax';
import { prepareFormSchema } from '@/libs/zod';

const VatProcessSchema = z.enum(['oss', 'micro_business']);

export type VatProcess = z.infer<typeof VatProcessSchema>;

/**
 * No `.catch()` on `type`: it widens zod's *input* type to `unknown`, which
 * leaves every `useWatch`/`field.value` on this form untyped. The stored value
 * is normalized to one of the two processes as the page hydrates, and the
 * response schema (`EuTaxRegionSchema.type`) stays a lenient string, so drift
 * is still absorbed on the read path.
 */
const TaxRegionEuFormShape = z.object({
  type: VatProcessSchema.default('oss'),
  countries: z.array(CountryTaxRateSchema).default([]),
});

export const TaxRegionEuFormSchema = prepareFormSchema(TaxRegionEuFormShape).transform((values) => ({
  type: values.type,
  countries: values.countries,
}));

export type TaxRegionEuFormInput = z.input<typeof TaxRegionEuFormSchema>;

export type TaxRegionEuFormPayload = z.output<typeof TaxRegionEuFormSchema>;
