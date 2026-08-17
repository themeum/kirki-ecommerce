import { describe, expect, it } from 'vitest';

import { ProductVariationPopoverFormSchema } from '@/features/products/schemas/forms/product-variation-popover-form';

describe('ProductVariationPopoverFormSchema', () => {
  it('mirrors title into value', () => {
    const result = ProductVariationPopoverFormSchema.parse({ title: 'Cerulean', color: '#007ba7' });
    expect(result).toEqual({ title: 'Cerulean', value: 'Cerulean', color: '#007ba7' });
  });

  it('rejects a blank required title or color', () => {
    expect(ProductVariationPopoverFormSchema.safeParse({ title: '  ', color: '#fff' }).success).toBe(false);
    expect(ProductVariationPopoverFormSchema.safeParse({ title: 'x', color: '  ' }).success).toBe(false);
  });
});
