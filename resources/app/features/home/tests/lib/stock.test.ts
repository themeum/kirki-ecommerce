import { describe, expect, it, vi } from 'vitest';

import { getStockBadge } from '@/features/home/lib/stock';

vi.mock('@/wpi18n', () => ({
  __: (text: string) => text,
  sprintf: (format: string, value: number) => format.replace('%d', String(value)),
}));

describe('getStockBadge', () => {
  it('shows the units left when the product tracks inventory', () => {
    expect(
      getStockBadge({ availability_status: 'in_stock', track_inventory: true, inventory: 59 }),
    ).toEqual({ text: '59 left in stock', variant: 'default' });
  });

  it('warns when tracked stock is low', () => {
    expect(
      getStockBadge({ availability_status: 'low_stock', track_inventory: true, inventory: 3 }),
    ).toEqual({ text: '3 left in stock', variant: 'warning' });
  });

  it('shows in stock when the product does not track inventory', () => {
    expect(
      getStockBadge({ availability_status: 'in_stock', track_inventory: false, inventory: 0 }),
    ).toEqual({ text: 'In stock', variant: 'success' });
  });

  it('shows out of stock whether or not inventory is tracked', () => {
    expect(
      getStockBadge({ availability_status: 'out_of_stock', track_inventory: true, inventory: 0 }),
    ).toEqual({ text: 'Out of stock', variant: 'destructive' });
    expect(
      getStockBadge({ availability_status: 'out_of_stock', track_inventory: false, inventory: 0 }),
    ).toEqual({ text: 'Out of stock', variant: 'destructive' });
  });

  it('shows no badge for a deleted product', () => {
    expect(
      getStockBadge({ availability_status: null, track_inventory: false, inventory: 0 }),
    ).toBeNull();
  });
});
