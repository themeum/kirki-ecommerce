import { describe, expect, it } from 'vitest';

import { slugify } from '@/utils/string';

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Yellow T-Shirt For Men')).toBe('yellow-t-shirt-for-men');
  });

  it('strips accented characters down to their base letter', () => {
    expect(slugify('Café Déjà Vu')).toBe('cafe-deja-vu');
  });

  it('replaces punctuation with a dash', () => {
    expect(slugify("Men's Shoes & Boots (2024)")).toBe('men-s-shoes-boots-2024');
  });

  it('collapses repeated separators into one dash', () => {
    expect(slugify('too   many---spaces')).toBe('too-many-spaces');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugify('  -Leading and trailing-  ')).toBe('leading-and-trailing');
  });
});
