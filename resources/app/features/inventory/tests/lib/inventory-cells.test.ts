import { describe, expect, it } from 'vitest';

import { resolveAvailableCell, resolveCommittedCell } from '@/features/inventory/lib/inventory-cells';
import type { InventoryVariant } from '@/features/products';

const buildVariant = (overrides: Partial<InventoryVariant> = {}): InventoryVariant => ({
  id: 1,
  sku: 'SKU-1',
  display_price: 79.99,
  display_price_money_object: {
    raw: 79.99,
    display: '$79.99',
    currency: { code: 'USD', symbol: '$' },
  },
  display_sale_price: null,
  display_sale_price_money_object: null,
  attribute_value_labels: ['Small', 'Red'],
  track_inventory: true,
  available_quantity: 500,
  committed_quantity: 450,
  availability_status: 'in_stock',
  availability_label: 'In Stock',
  product: { id: 10, name: 'T-shirt', image: null },
  ...overrides,
});

describe('resolveAvailableCell', () => {
  it('shows the success-coloured label for an untracked variant that is in stock', () => {
    const cell = resolveAvailableCell(
      buildVariant({
        track_inventory: false,
        availability_status: 'in_stock',
        availability_label: 'In Stock',
      }),
    );

    expect(cell).toEqual({ text: 'In Stock', color: 'success' });
  });

  it('shows the critical-coloured label for an untracked variant that is out of stock', () => {
    const cell = resolveAvailableCell(
      buildVariant({
        track_inventory: false,
        availability_status: 'out_of_stock',
        availability_label: 'Out of Stock',
      }),
    );

    expect(cell).toEqual({ text: 'Out of Stock', color: 'critical' });
  });

  it('shows a tracked variant quantity in the default colour when it is in stock', () => {
    const cell = resolveAvailableCell(
      buildVariant({ available_quantity: 500, availability_status: 'in_stock' }),
    );

    expect(cell).toEqual({ text: '500', color: 'primary' });
  });

  it('shows a tracked variant quantity in critical when it is low on stock', () => {
    const cell = resolveAvailableCell(
      buildVariant({ available_quantity: 3, availability_status: 'low_stock' }),
    );

    expect(cell).toEqual({ text: '3', color: 'critical' });
  });

  it('shows a zero quantity in critical rather than as a neutral number', () => {
    const cell = resolveAvailableCell(
      buildVariant({ available_quantity: 0, availability_status: 'out_of_stock' }),
    );

    expect(cell).toEqual({ text: '0', color: 'critical' });
  });

  it('falls back to a dash when an untracked variant carries no label', () => {
    const cell = resolveAvailableCell(
      buildVariant({ track_inventory: false, availability_status: null, availability_label: null }),
    );

    expect(cell.text).toBe('--');
  });
});

describe('resolveCommittedCell', () => {
  it('shows the committed quantity for a tracked variant', () => {
    const cell = resolveCommittedCell(buildVariant({ committed_quantity: 450 }));

    expect(cell).toEqual({ text: '450', color: 'primary' });
  });

  it('shows a zero committed quantity as a real count rather than a dash', () => {
    const cell = resolveCommittedCell(buildVariant({ committed_quantity: 0 }));

    expect(cell).toEqual({ text: '0', color: 'primary' });
  });

  it('shows the committed quantity for an untracked variant', () => {
    const cell = resolveCommittedCell(
      buildVariant({ track_inventory: false, committed_quantity: 12 }),
    );

    expect(cell.text).toBe('12');
  });

  it('shows a dash only when no committed quantity was reported', () => {
    const cell = resolveCommittedCell(buildVariant({ committed_quantity: null }));

    expect(cell.text).toBe('--');
  });
});
