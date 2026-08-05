import { describe, expect, it } from 'vitest';

import { CollectionFormSchema } from '@/schemas/forms/collection-form';

describe('CollectionFormSchema', () => {
  const base = {
    title: 'Winter Sale',
    slug: 'winter-sale',
    description: '',
    banner: null,
    seo_title: '',
    seo_description: '',
  };

  it('produces the exact payload for a fully filled form', () => {
    const result = CollectionFormSchema.parse({
      ...base,
      description: 'Cozy winter items',
      banner: 5,
      seo_title: 'Winter Sale',
      seo_description: 'Shop the winter sale',
    });

    expect(result).toEqual({
      title: 'Winter Sale',
      slug: 'winter-sale',
      description: 'Cozy winter items',
      banner: 5,
      seo_title: 'Winter Sale',
      seo_description: 'Shop the winter sale',
    });
  });

  it('sends null for blank description, seo_title, and seo_description', () => {
    const result = CollectionFormSchema.parse(base);
    expect(result.description).toBeNull();
    expect(result.seo_title).toBeNull();
    expect(result.seo_description).toBeNull();
  });

  it('collapses a media object banner to its numeric id', () => {
    const result = CollectionFormSchema.parse({
      ...base,
      banner: { id: 11, url: 'https://x/banner.png' },
    });
    expect(result.banner).toBe(11);
  });

  it('rejects a blank required title or slug', () => {
    expect(CollectionFormSchema.safeParse({ ...base, title: '  ' }).success).toBe(false);
    expect(CollectionFormSchema.safeParse({ ...base, slug: '  ' }).success).toBe(false);
  });
});
