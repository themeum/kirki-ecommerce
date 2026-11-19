import { describe, expect, it } from 'vitest';

import { inventoryTypeOptions } from '@/features/inventory/types';

describe('inventoryTypeOptions', () => {
  it('offers in stock, low stock and out of stock', () => {
    expect(inventoryTypeOptions.map((option) => option.value)).toEqual([
      'all',
      'in_stock',
      'low_stock',
      'out_of_stock',
    ]);
  });
});
