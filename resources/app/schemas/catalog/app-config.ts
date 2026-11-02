import { z } from 'zod';

import { CurrencySettingsSchema } from '@/schemas/catalog/settings';

/**
 * The lightweight id/code/name/symbol currency reference, not the full
 * `Currency` entity from `schemas/catalog/currency.ts`.
 */
const AppConfigCurrencySchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
});

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
    base_currency: AppConfigCurrencySchema.nullish(),
    currency_preferences: CurrencySettingsSchema.pick({
      currency_format: true,
      currency_position: true,
      thousand_separator: true,
      decimal_separator: true,
    }).nullish(),
  })
  .passthrough();

export type AppConfig = z.infer<typeof AppConfigSchema>;
