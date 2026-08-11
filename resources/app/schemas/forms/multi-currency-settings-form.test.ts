import { describe, expect, it } from 'vitest';

import { MultiCurrencySettingsFormSchema } from '@/schemas/forms/multi-currency-settings-form';

describe('MultiCurrencySettingsFormSchema', () => {
  const base = {
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

  it('pins is_automatic_update_enabled to false regardless of input (@todo in the transform)', () => {
    const result = MultiCurrencySettingsFormSchema.parse({
      ...base,
      is_automatic_update_enabled: true,
      api_config: { ...base.api_config, api_key: 'secret-key' },
    });
    expect(result.is_automatic_update_enabled).toBe(false);
    expect(result.api_config.api_key).toBe('secret-key');
  });

  it('sends null for blank api_provider and format fields', () => {
    const result = MultiCurrencySettingsFormSchema.parse(base);
    expect(result.api_provider).toBeNull();
    expect(result.api_config.api_key).toBeNull();
  });

  it('defaults is_automatic_update_enabled to false', () => {
    const result = MultiCurrencySettingsFormSchema.parse({});
    expect(result.is_automatic_update_enabled).toBe(false);
  });
});
