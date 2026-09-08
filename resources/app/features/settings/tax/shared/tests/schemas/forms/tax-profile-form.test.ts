import { describe, expect, it } from 'vitest';

import { TaxProfileFormSchema } from '@/features/settings/tax/shared/schemas/forms/tax-profile-form';

describe('TaxProfileFormSchema', () => {
  it('produces the exact payload', () => {
    expect(TaxProfileFormSchema.parse({ name: 'Books' })).toEqual({ name: 'Books' });
  });

  it('rejects a blank required name', () => {
    expect(TaxProfileFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
