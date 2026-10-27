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

  it('takes a title alone when no color is asked for', () => {
    const result = ProductVariationPopoverFormSchema.parse({ title: 'XXL', color: '', requires_color: false });
    expect(result).toEqual({ title: 'XXL', value: 'XXL', color: '' });
  });
});
