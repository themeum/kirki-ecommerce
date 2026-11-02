import { describe, expect, it } from 'vitest';

import {
  calculateDiscountPercentage,
  getInitialOpenRows,
} from '@/features/products/components/variant-sections/price/price-rows';

describe('calculateDiscountPercentage', () => {
  it('reports a genuine discount as a whole percent', () => {
    expect(calculateDiscountPercentage(29, 26.1)).toBe(10);
  });

  it('rounds to the nearest whole percent', () => {
    expect(calculateDiscountPercentage(29.99, 19.99)).toBe(33);
  });

  it('accepts the string values money inputs hold', () => {
    expect(calculateDiscountPercentage('29.00', '26.10')).toBe(10);
  });

  it.each([
    ['sale equal to price', 29, 29],
    ['sale above price', 29, 39],
    ['zero sale price', 29, 0],
    ['zero price', 0, 10],
    ['empty sale price', 29, ''],
    ['absent sale price', 29, null],
    ['absent price', null, 10],
    ['negative price', -29, 10],
  ])('returns null for %s', (_label, price, sale) => {
    expect(calculateDiscountPercentage(price, sale)).toBeNull();
  });
});

describe('getInitialOpenRows', () => {
  it('opens nothing for a product with only a price', () => {
    expect(getInitialOpenRows({ base_price: 29 })).toEqual([]);
  });

  it('opens the sale row for a stored sale price', () => {
    expect(getInitialOpenRows({ base_sale_price: 19 })).toEqual(['sale']);
  });

  it('opens the unit row when any single unit field is set', () => {
    expect(getInitialOpenRows({ base_unit: 'kg' })).toEqual(['unit']);
    expect(getInitialOpenRows({ total_unit_amount: 5 })).toEqual(['unit']);
  });

  it('opens the cost row for a stored cost', () => {
    expect(getInitialOpenRows({ base_cost_of_goods: 12 })).toEqual(['cost']);
  });

  it('opens every row a product has data for', () => {
    expect(
      getInitialOpenRows({
        base_sale_price: 19,
        total_unit_amount: 1,
        total_unit: 'kg',
        base_cost_of_goods: 12,
      }),
    ).toEqual(['sale', 'unit', 'cost']);
  });

  it('treats empty strings as no data', () => {
    expect(getInitialOpenRows({ base_sale_price: '', base_cost_of_goods: '' })).toEqual([]);
  });
});
