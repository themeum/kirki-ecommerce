import { z } from 'zod';

import { ProductCurrencySchema } from '@/schemas/catalog/product';

export const AppConfigUserSchema = z
  .object({
    id: z.number(),
    email: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    display_name: z.string().nullish(),
    avatar: z.string().nullish(),
    active_role: z.string().nullish(),
  })
  .passthrough();

export type AppConfigUser = z.infer<typeof AppConfigUserSchema>;

export const AppConfigSchema = z
  .object({
    name: z.string().nullish(),
    version: z.string().nullish(),
    current_user: AppConfigUserSchema.nullish(),
    base_currency: ProductCurrencySchema.nullish(),
  })
  .passthrough();

export type AppConfig = z.infer<typeof AppConfigSchema>;
