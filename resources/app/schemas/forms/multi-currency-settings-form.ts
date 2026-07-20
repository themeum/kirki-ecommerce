import { z } from 'zod';

export const ApiConfigSchema = z
  .object({
    api_key: z.string().optional(),
    update_frequency: z.string().optional(),
    fallback_behaviour: z.string().optional(),
    is_cache_enabled: z.boolean().optional(),
  })
  .passthrough();

export const MultiCurrencySettingsFormSchema = z
  .object({
    is_automatic_update_enabled: z.boolean().optional(),
    api_provider: z.string().optional().nullable(),
    api_config: ApiConfigSchema.optional().nullable(),
    currency_format: z.string().optional().nullable(),
    currency_position: z.string().optional().nullable(),
    thousand_separator: z.string().optional().nullable(),
    decimal_separator: z.string().optional().nullable(),
    last_sync_at: z.string().optional().nullable(),
    next_sync_at: z.string().optional().nullable(),
  })
  .passthrough();

export type MultiCurrencySettingsFormValues = z.infer<
  typeof MultiCurrencySettingsFormSchema
>;

export const multiCurrencySettingsDefaultValues: MultiCurrencySettingsFormValues =
  {
    is_automatic_update_enabled: false,
    api_provider: '',
    api_config: {
      api_key: '',
      update_frequency: 'every_1_hour',
      fallback_behaviour: 'last_known_rate',
      is_cache_enabled: false,
    },
    currency_format: 'short',
    currency_position: 'before',
    thousand_separator: ',',
    decimal_separator: '.',
    last_sync_at: null,
    next_sync_at: null,
  };
