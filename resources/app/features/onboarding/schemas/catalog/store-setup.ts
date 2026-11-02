import { z } from 'zod';

const StoreSetupSummarySchema = z.object({
  country: z.object({
    code: z.string(),
    name: z.string(),
  }),
  currency: z.object({
    code: z.string(),
    symbol: z.string().nullish(),
  }),
  pages: z.array(z.string()).default([]),
  tax: z
    .object({
      is_tax_inclusive_price: z.boolean(),
    })
    .nullish(),
});

type StoreSetupSummary = z.infer<typeof StoreSetupSummarySchema>;

export { type StoreSetupSummary, StoreSetupSummarySchema };
