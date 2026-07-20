import { z } from 'zod';

export const TaxRulesFormSchema = z.object({
  conditions: z.array(
    z.object({
      id: z.string(),
      condition: z.string(),
      value: z.any().nullable(),
      type: z.string().optional(),
    }),
  ),
  action_type: z.string(),
  action_value: z.union([z.string(), z.number()]),
  selectedCountries: z.array(z.union([z.string(), z.number()])),
});

export type TaxRulesFormValues = z.infer<typeof TaxRulesFormSchema>;
