import { describe, expect, it } from 'vitest';

import { resolveVariantFieldName } from '@/features/products/components/variant-sections/resolve-field-name';

describe('resolveVariantFieldName', () => {
  it('leaves the key untouched at the root scope', () => {
    expect(resolveVariantFieldName('', 'base_price')).toBe('base_price');
  });

  it('prefixes the key inside the product form variant array', () => {
    expect(resolveVariantFieldName('variants.0.', 'base_price')).toBe('variants.0.base_price');
  });

  it('resolves against the given variant index', () => {
    expect(resolveVariantFieldName('variants.2.', 'sku')).toBe('variants.2.sku');
  });
});
