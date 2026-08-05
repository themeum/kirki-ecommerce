import { describe, expect, it } from 'vitest';

import { VatCollectionFormSchema } from '@/schemas/forms/vat-collection-form';

describe('VatCollectionFormSchema', () => {
  it('produces the exact payload', () => {
    const result = VatCollectionFormSchema.parse({ state: 'Germany', rate: '19', flag: 'de' });
    expect(result).toEqual({ state: 'Germany', rate: '19', flag: 'de' });
  });

  it('sends undefined (not null) for a blank flag, matching TaxRate', () => {
    const result = VatCollectionFormSchema.parse({ state: 'Germany', rate: '19', flag: '' });
    expect(result.flag).toBeUndefined();
    expect('flag' in result).toBe(true);
  });

  it('rejects a blank required state or rate', () => {
    expect(VatCollectionFormSchema.safeParse({ state: '  ', rate: '19' }).success).toBe(false);
    expect(VatCollectionFormSchema.safeParse({ state: 'Germany', rate: '' }).success).toBe(false);
  });
});
