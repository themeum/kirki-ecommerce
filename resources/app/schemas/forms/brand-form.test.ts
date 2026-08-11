import { describe, expect, it } from 'vitest';

import { BrandFormSchema } from '@/schemas/forms/brand-form';

describe('BrandFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = BrandFormSchema.parse({
      name: 'Apple',
      slug: 'apple',
      description: 'A tech company',
      logo: 42,
    });

    expect(result).toEqual({
      name: 'Apple',
      slug: 'apple',
      description: 'A tech company',
      logo: 42,
    });
  });

  it('sends null for a blank description rather than an empty string', () => {
    const result = BrandFormSchema.parse({
      name: 'Apple',
      slug: 'apple',
      description: '',
      logo: null,
    });

    expect(result.description).toBeNull();
  });

  it('sends null for a missing logo', () => {
    const result = BrandFormSchema.parse({
      name: 'Apple',
      slug: 'apple',
      description: '',
      logo: null,
    });

    expect(result.logo).toBeNull();
  });

  it('collapses a media object logo to its numeric id', () => {
    const result = BrandFormSchema.parse({
      name: 'Apple',
      slug: 'apple',
      description: '',
      logo: { id: 7, url: 'https://x/logo.png' },
    });

    expect(result.logo).toBe(7);
  });

  it('rejects a blank required name', () => {
    const result = BrandFormSchema.safeParse({
      name: '   ',
      slug: 'apple',
      description: '',
      logo: null,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a blank slug, leaving generation to the server', () => {
    const result = BrandFormSchema.safeParse({
      name: 'Apple',
      slug: '',
      description: '',
      logo: null,
    });

    expect(result.success).toBe(true);
  });
});
