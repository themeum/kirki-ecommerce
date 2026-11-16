import { describe, expect, it, vi } from 'vitest';

import { getStockText } from '@/features/home/lib/stock';

vi.mock('@/wpi18n', () => ({
  __: (text: string) => text,
  sprintf: (format: string, value: number) => format.replace('%d', String(value)),
}));

describe('getStockText', () => {
  it('shows the units left when the product tracks inventory', () => {
    expect(
      getStockText({ availability_status: 'in_stock', track_inventory: true, inventory: 59 }),
    ).toEqual({ text: '59 left in stock', color: 'secondary' });
  });

  it('shows low tracked stock in red', () => {
    expect(
      getStockText({ availability_status: 'low_stock', track_inventory: true, inventory: 3 }),
    ).toEqual({ text: '3 left in stock', color: 'critical' });
  });

  it('shows in stock when the product does not track inventory', () => {
    expect(
      getStockText({ availability_status: 'in_stock', track_inventory: false, inventory: 0 }),
    ).toEqual({ text: 'In stock', color: 'secondary' });
  });

  it('shows out of stock in red whether or not inventory is tracked', () => {
    expect(
      getStockText({ availability_status: 'out_of_stock', track_inventory: true, inventory: 0 }),
    ).toEqual({ text: 'Out of stock', color: 'critical' });
    expect(
      getStockText({ availability_status: 'out_of_stock', track_inventory: false, inventory: 0 }),
    ).toEqual({ text: 'Out of stock', color: 'critical' });
  });

  it('shows no stock line for a deleted product', () => {
    expect(
      getStockText({ availability_status: null, track_inventory: false, inventory: 0 }),
    ).toBeNull();
  });
});
