import { describe, expect, it } from 'vitest';

import { AppConfigSchema } from '@/schemas/catalog/app-config';

describe('AppConfigSchema', () => {
  it('accepts the documented response (app-config/appconfig.yml)', () => {
    const result = AppConfigSchema.safeParse({
      name: 'Kirki eCommerce',
      version: '1.0.0',
      current_user: {
        id: 14,
        email: 'ashraful.coder@gmail.com',
        first_name: 'ashraful',
        last_name: '',
        display_name: 'ashraful',
        avatar: 'https://secure.gravatar.com/avatar/x',
        active_role: 'administrator',
      },
      base_currency: {
        id: 2,
        code: 'eur',
        name: 'EURO',
        symbol: '€',
        exchange_rate: 1,
        is_base: false,
        is_active: true,
        created_at: '2026-01-30T12:21:56.000000Z',
        updated_at: '2026-02-17T07:18:50.000000Z',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = AppConfigSchema.safeParse({ name: 'Kirki eCommerce', unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = AppConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
