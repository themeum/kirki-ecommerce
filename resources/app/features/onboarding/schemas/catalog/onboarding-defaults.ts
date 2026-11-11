import { z } from 'zod';

const OnboardingDefaultsSchema = z.object({
  source: z.literal('woocommerce').nullable(),
  values: z
    .object({
      store_name: z.string().optional(),
      industry: z.string().optional(),
      country: z.string().optional(),
      store_address: z
        .object({
          address_line_1: z.string().optional(),
          address_line_2: z.string().optional(),
          city: z.string().optional(),
          postal_code: z.string().optional(),
        })
        .optional(),
      currency: z.string().optional(),
      is_tax_enabled: z.boolean().optional(),
      is_tax_inclusive_price: z.boolean().optional(),
    })
    .default({}),
});

type OnboardingDefaults = z.infer<typeof OnboardingDefaultsSchema>;

export { OnboardingDefaultsSchema };
export type { OnboardingDefaults };
