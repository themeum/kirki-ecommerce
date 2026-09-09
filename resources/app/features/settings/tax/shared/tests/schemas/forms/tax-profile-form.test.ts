import { describe, expect, it } from 'vitest';

import { TaxProfileFormSchema } from '@/features/settings/tax/shared/schemas/forms/tax-profile-form';

describe('TaxProfileFormSchema', () => {
  it('produces the exact payload', () => {
    expect(TaxProfileFormSchema.parse({ name: 'Books' })).toEqual({
      name: 'Books',
      is_default: false,
    });
  });

  it('passes is_default through', () => {
    expect(
      TaxProfileFormSchema.parse({ name: 'Books', is_default: true }),
    ).toEqual({ name: 'Books', is_default: true });
  });

  it('rejects a blank required name', () => {
    expect(TaxProfileFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
