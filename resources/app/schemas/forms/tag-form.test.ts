import { describe, expect, it } from 'vitest';

import { TagFormSchema } from '@/schemas/forms/tag-form';

describe('TagFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = TagFormSchema.parse({
      name: 'Sale',
      slug: 'sale',
      description: 'Discounted items',
    });

    expect(result).toEqual({
      name: 'Sale',
      slug: 'sale',
      description: 'Discounted items',
    });
  });

  it('sends null for a blank description rather than an empty string', () => {
    const result = TagFormSchema.parse({
      name: 'Sale',
      slug: 'sale',
      description: '',
    });

    expect(result.description).toBeNull();
  });

  it('rejects a blank required name or slug', () => {
    expect(TagFormSchema.safeParse({ name: '  ', slug: 'sale', description: '' }).success).toBe(false);
    expect(TagFormSchema.safeParse({ name: 'Sale', slug: '  ', description: '' }).success).toBe(false);
  });
});
