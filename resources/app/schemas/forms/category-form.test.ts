import { describe, expect, it } from 'vitest';

import { CategoryFormSchema } from '@/schemas/forms/category-form';

describe('CategoryFormSchema', () => {
  const base = {
    name: 'Shoes',
    slug: 'shoes',
    description: '',
    parent_id: null,
    image: null,
    is_active: null,
  };

  it('produces the exact payload for a fully filled form', () => {
    const result = CategoryFormSchema.parse({
      ...base,
      description: 'Footwear',
      parent_id: '3',
      image: 9,
      is_active: true,
    });

    expect(result).toEqual({
      name: 'Shoes',
      slug: 'shoes',
      description: 'Footwear',
      parent_id: 3,
      image: 9,
      is_active: true,
    });
  });

  it('coerces an empty-string parent_id to null instead of NaN', () => {
    const result = CategoryFormSchema.parse({ ...base, parent_id: '' });
    expect(result.parent_id).toBeNull();
  });

  it('coerces a numeric-string parent_id to a number', () => {
    const result = CategoryFormSchema.parse({ ...base, parent_id: '12' });
    expect(result.parent_id).toBe(12);
  });

  it('sends null for a blank description', () => {
    const result = CategoryFormSchema.parse(base);
    expect(result.description).toBeNull();
  });

  it('sends null for is_active when unset, matching the no-UI-control default', () => {
    const result = CategoryFormSchema.parse({ ...base, is_active: undefined });
    expect(result.is_active).toBeNull();
  });

  it('rejects a blank required name or slug', () => {
    expect(CategoryFormSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
    expect(CategoryFormSchema.safeParse({ ...base, slug: '  ' }).success).toBe(false);
  });
});
