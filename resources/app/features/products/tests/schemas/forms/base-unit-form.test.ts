import { describe, expect, it } from 'vitest';

import type { ProductVariant } from '@/features/products/schemas/catalog/variant';
import { BaseUnitFormSchema, mapBaseUnitFromVariant } from '@/features/products/schemas/forms/base-unit-form';

describe('BaseUnitFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = BaseUnitFormSchema.parse({
      total_unit_amount: '500',
      total_unit: 'g',
      base_unit_amount: '100',
      base_unit: 'g',
      base_price: '9.99',
    });

    expect(result).toEqual({
      total_unit_amount: '500',
      total_unit: 'g',
      base_unit_amount: '100',
      base_unit: 'g',
      base_price: '9.99',
    });
  });

  it('maps undefined fields to null', () => {
    const result = BaseUnitFormSchema.parse({});
    expect(result).toEqual({
      total_unit_amount: null,
      total_unit: null,
      base_unit_amount: null,
      base_unit: null,
      base_price: null,
    });
  });
});

describe('mapBaseUnitFromVariant', () => {
  it('picks matching fields from a variant', () => {
    const result = mapBaseUnitFromVariant({
      total_unit_amount: 500,
      total_unit: 'g',
      base_unit_amount: 100,
      base_unit: 'g',
      base_price: '9.99',
    } as unknown as ProductVariant);

    expect(result).toEqual({
      total_unit_amount: 500,
      total_unit: 'g',
      base_unit_amount: 100,
      base_unit: 'g',
      base_price: '9.99',
    });
  });

  it('falls back to nulls when no variant is given', () => {
    const result = mapBaseUnitFromVariant(undefined);
    expect(result).toEqual({
      total_unit_amount: null,
      total_unit: null,
      base_unit_amount: null,
      base_unit: null,
      base_price: null,
    });
  });
});
