import { describe, expect, it } from 'vitest';

import { ProductAddCategoryFormSchema } from '@/schemas/forms/product-add-category-form';

describe('ProductAddCategoryFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = ProductAddCategoryFormSchema.parse({ name: 'Shoes', parent_id: '3' });
    expect(result).toEqual({ name: 'Shoes', parent_id: 3 });
  });

  it('coerces an empty-string parent_id to null', () => {
    const result = ProductAddCategoryFormSchema.parse({ name: 'Shoes', parent_id: '' });
    expect(result.parent_id).toBeNull();
  });

  it('rejects a blank required name', () => {
    expect(ProductAddCategoryFormSchema.safeParse({ name: '  ', parent_id: null }).success).toBe(false);
  });
});
