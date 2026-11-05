import { z } from 'zod';

import { CurrencyDraftSchema } from '@/features/settings/multi-currency/schemas/catalog/currency';
import { prepareFormSchema, requiredWhen } from '@/libs/zod';
import { __ } from '@/wpi18n';

export const ApiConfigSchema = z.object({
  api_key: z.string().nullish().default(''),
  update_frequency: z.string().nullish().default('every_1_hour'),
});

export const CurrencyRateItemSchema =CurrencyDraftSchema.extend({
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
  api_provider: requiredWhen(
    z.string().nullish().default(''),
    (values) =>
      Boolean(values.is_automatic_update_enabled) &&
      ((values.currencies ?? []) as unknown[]).length > 1 &&
      !values.api_provider,
    __('Please select an API provider', 'kirki-ecommerce'),
  ),
  api_configs: z.record(z.string(), ApiConfigSchema).nullish().default({}),
  currency_format: z.string().nullish().default('short'),
  currency_position: z.string().nullish().default('before'),
  thousand_separator: z.string().nullish().default(','),
  decimal_separator: z.string().nullish().default('.'),
  last_sync_at: z.string().nullish().default(null),
  next_sync_at: z.string().nullish().default(null),
  last_sync_error: z.string().nullish().default(null),
  last_sync_error_at: z.string().nullish().default(null),
  currencies: z.array(CurrencyRateItemSchema).default([]),
});

export const MultiCurrencySettingsFormSchema = prepareFormSchema(
  MultiCurrencySettingsFormShape,
).transform((values) => ({
  is_automatic_update_enabled:
    values.currencies.length > 1 && Boolean(values.is_automatic_update_enabled),
  api_provider: values.api_provider || null,
  api_configs: Object.fromEntries(
    Object.entries(values.api_configs ?? {}).map(([providerId, config]) => [
      providerId,
      {
        api_key: config?.api_key || null,
        update_frequency: config?.update_frequency || null,
      },
    ]),
  ),
  currency_format: values.currency_format || null,
  currency_position: values.currency_position || null,
  thousand_separator: values.thousand_separator || null,
  decimal_separator: values.decimal_separator || null,
}));

export type MultiCurrencySettingsFormInput = z.input<typeof MultiCurrencySettingsFormSchema>;

export type MultiCurrencySettingsFormPayload = z.output<typeof MultiCurrencySettingsFormSchema>;
