import { describe, expect, it } from 'vitest';

import { ProductAttributeFormSchema } from '@/features/products/schemas/forms/product-attribute-form';

describe('ProductAttributeFormSchema', () => {
  it('renames the multi-select value/title pair to the payload id/value', () => {
    const result = ProductAttributeFormSchema.parse({
      id: 1,
      name: 'Color',
      values: [
        { value: 10, title: 'Red', color: '#ff0000' },
        { value: 11, title: 'Blue', color: '#0000ff' },
      ],
    });

    expect(result).toEqual({
      id: 1,
      name: 'Color',
      values: [
        { id: 10, value: 'Red', color: '#ff0000' },
        { id: 11, value: 'Blue', color: '#0000ff' },
      ],
    });
  });

  it('rejects a blank required name', () => {
    const result = ProductAttributeFormSchema.safeParse({
      id: 1,
      name: '  ',
      values: [{ value: 10, title: 'Red' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a form with no values selected', () => {
    const result = ProductAttributeFormSchema.safeParse({ id: 1, name: 'Color', values: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a missing attribute id', () => {
    const result = ProductAttributeFormSchema.safeParse({
      name: 'Color',
      values: [{ value: 10, title: 'Red' }],
    });
    expect(result.success).toBe(false);
  });
});
