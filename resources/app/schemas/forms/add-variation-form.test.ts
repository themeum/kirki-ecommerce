import { describe, expect, it } from 'vitest';

import { AddVariationFormSchema } from '@/schemas/forms/add-variation-form';

describe('AddVariationFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = AddVariationFormSchema.parse({ name: 'Material', type: 'list' });
    expect(result).toEqual({ name: 'Material', type: 'list' });
  });

  it('sends null when no type is provided', () => {
    const result = AddVariationFormSchema.parse({ name: 'Material', type: null });
    expect(result.type).toBeNull();
  });

  it('rejects a blank required name', () => {
    expect(AddVariationFormSchema.safeParse({ name: '  ', type: 'list' }).success).toBe(false);
  });
});
