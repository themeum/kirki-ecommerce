import { describe, expect, it } from 'vitest';

import { ProductAdditionalInfoFormSchema } from '@/features/products/schemas/forms/product-additional-info-form';

describe('ProductAdditionalInfoFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = ProductAdditionalInfoFormSchema.parse({
      title: 'Care Instructions',
      description: 'Wipe clean with a damp cloth.',
    });
    expect(result).toEqual({
      title: 'Care Instructions',
      description: 'Wipe clean with a damp cloth.',
    });
  });

  it('rejects a blank required title or description', () => {
    expect(
      ProductAdditionalInfoFormSchema.safeParse({ title: '  ', description: 'x' }).success,
    ).toBe(false);
    expect(
      ProductAdditionalInfoFormSchema.safeParse({ title: 'x', description: '  ' }).success,
    ).toBe(false);
  });
});
