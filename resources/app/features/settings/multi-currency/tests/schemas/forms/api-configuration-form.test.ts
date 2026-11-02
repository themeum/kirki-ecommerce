import { describe, expect, it } from 'vitest';

import { ApiConfigurationFormSchema } from '@/features/settings/multi-currency/schemas/forms/api-configuration-form';

describe('ApiConfigurationFormSchema', () => {
  it('produces the exact payload', () => {
    const result = ApiConfigurationFormSchema.parse({
      api_key: 'secret-key',
      update_frequency: 'every_1_hour',
    });
    expect(result).toEqual({
      api_key: 'secret-key',
      update_frequency: 'every_1_hour',
    });
  });

  it('rejects a missing update frequency', () => {
    expect(
      ApiConfigurationFormSchema.safeParse({
        api_key: '',
        update_frequency: '',
      }).success,
    ).toBe(false);
  });

  it('does not send a fallback behaviour', () => {
    const result = ApiConfigurationFormSchema.parse({
      api_key: 'secret-key',
      update_frequency: 'every_1_hour',
      fallback_behaviour: 'last_known_rate',
    });
    expect(result).not.toHaveProperty('fallback_behaviour');
  });
});
