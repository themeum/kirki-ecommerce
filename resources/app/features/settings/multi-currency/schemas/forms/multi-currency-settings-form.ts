import { z } from 'zod';

import { CurrencyDraftSchema } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const ApiConfigSchema = z.object({
  api_key: z.string().nullish().default(''),
  update_frequency: z.string().nullish().default('every_1_hour'),
  fallback_behaviour: z.string().nullish().default('last_known_rate'),
  is_cache_enabled: z.boolean().nullish().default(false),
});

const CurrencyRateItemSchema = CurrencyDraftSchema.extend({
  exchange_rate: z
    .union([z.number(), z.string()])
    .nullish()
    .refine(
      (value) => value != null && value !== '' && Number(value) > 0,
      __('Exchange rate must be greater than 0', 'kirki-ecommerce'),
    ),
});

export type CurrencyRateItem = z.infer<typeof CurrencyRateItemSchema>;

const MultiCurrencySettingsFormShape = z.object({
  is_automatic_update_enabled: z.boolean().nullish().default(false),
  api_provider: z.string().nullish().default(''),
  api_config: ApiConfigSchema.nullish(),
  currency_format: z.string().nullish().default('short'),
  currency_position: z.string().nullish().default('before'),
  thousand_separator: z.string().nullish().default(','),
  decimal_separator: z.string().nullish().default('.'),
  last_sync_at: z.string().nullish().default(null),
  next_sync_at: z.string().nullish().default(null),
  currencies: z.array(CurrencyRateItemSchema).default([]),
});

export const MultiCurrencySettingsFormSchema = prepareFormSchema(
  MultiCurrencySettingsFormShape,
).transform((values) => ({
  // is_automatic_update_enabled: values.is_automatic_update_enabled ?? false, // @todo: will be handled later.
  is_automatic_update_enabled: false,
  api_provider: values.api_provider || null,
  api_config: {
    api_key: values.api_config?.api_key || null,
    update_frequency: values.api_config?.update_frequency || null,
    fallback_behaviour: values.api_config?.fallback_behaviour || null,
    is_cache_enabled: values.api_config?.is_cache_enabled,
  },
  currency_format: values.currency_format || null,
  currency_position: values.currency_position || null,
  thousand_separator: values.thousand_separator || null,
  decimal_separator: values.decimal_separator || null,
  last_sync_at: values.last_sync_at,
  next_sync_at: values.next_sync_at,
}));

export type MultiCurrencySettingsFormInput = z.input<typeof MultiCurrencySettingsFormSchema>;

export type MultiCurrencySettingsFormPayload = z.output<typeof MultiCurrencySettingsFormSchema>;
