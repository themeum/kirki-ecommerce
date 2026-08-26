import { describe, expect, it } from 'vitest';

import {
  getAvailabilityColor,
  getAvailabilityDescription,
  getAvailabilityLabel,
  resolveGroupStatus,
  resolveVariantStatus,
} from '@/features/products/lib/availability';

describe('resolveVariantStatus', () => {
  it('untracked variant with in_stock true is in stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: false, inStock: true, availableQuantity: 0, lowStockThreshold: null },
      0,
    );

    expect(status).toBe('in_stock');
  });

  it('untracked variant with in_stock false is out of stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: false, inStock: false, availableQuantity: 999, lowStockThreshold: null },
      0,
    );

    expect(status).toBe('out_of_stock');
  });

  it('tracked variant at zero quantity is out of stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 0, lowStockThreshold: null },
      5,
    );

    expect(status).toBe('out_of_stock');
  });

  it('tracked variant at threshold is low stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 3, lowStockThreshold: 3 },
      0,
    );

    expect(status).toBe('low_stock');
  });

  it('tracked variant above threshold is in stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 4, lowStockThreshold: 3 },
      0,
    );

    expect(status).toBe('in_stock');
  });

  it('zero threshold never yields low stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 1, lowStockThreshold: 0 },
      5,
    );

    expect(status).toBe('in_stock');
  });

  it('back order at zero quantity still reports out of stock', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 0, lowStockThreshold: null },
      0,
    );

    expect(status).toBe('out_of_stock');
  });

  it('null threshold falls back to the store default', () => {
    const lowStock = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 5, lowStockThreshold: null },
      5,
    );
    const inStock = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 6, lowStockThreshold: null },
      5,
    );

    expect(lowStock).toBe('low_stock');
    expect(inStock).toBe('in_stock');
  });

  it('explicit zero threshold does not fall back to the store default', () => {
    const status = resolveVariantStatus(
      { trackInventory: true, inStock: true, availableQuantity: 5, lowStockThreshold: 0 },
      5,
    );

    expect(status).toBe('in_stock');
  });
});

describe('resolveGroupStatus', () => {
  it('all in stock resolves to in stock', () => {
    expect(resolveGroupStatus(['in_stock', 'in_stock'])).toBe('in_stock');
  });

  it('a low stock variant outweighs healthy ones', () => {
    expect(resolveGroupStatus(['in_stock', 'low_stock'])).toBe('low_stock');
  });

  it('some available, some gone is partially stocked', () => {
    expect(resolveGroupStatus(['in_stock', 'out_of_stock'])).toBe('partially_stocked');
  });

  it('a low stock variant outweighs a partial mix', () => {
    expect(resolveGroupStatus(['in_stock', 'out_of_stock', 'low_stock'])).toBe('low_stock');
  });

  it('everything out of stock resolves to out of stock', () => {
    expect(resolveGroupStatus(['out_of_stock', 'out_of_stock'])).toBe('out_of_stock');
  });

  it('does not depend on order', () => {
    const first = resolveGroupStatus(['in_stock', 'out_of_stock', 'low_stock']);
    const second = resolveGroupStatus(['in_stock', 'low_stock', 'out_of_stock']);

    expect(first).toBe('low_stock');
    expect(first).toBe(second);
  });

  it('a single-variant group reports its own status', () => {
    expect(resolveGroupStatus(['low_stock'])).toBe('low_stock');
  });

  it('an empty group reports no status', () => {
    expect(resolveGroupStatus([])).toBeNull();
  });
});

describe('getAvailabilityLabel', () => {
  it('maps every status to a distinct plain label', () => {
    const labels = [
      getAvailabilityLabel('in_stock'),
      getAvailabilityLabel('low_stock'),
      getAvailabilityLabel('out_of_stock'),
      getAvailabilityLabel('partially_stocked'),
    ];

    expect(new Set(labels).size).toBe(4);
  });

  it('prefixes the quantity for in stock when given a positive quantity', () => {
    expect(getAvailabilityLabel('in_stock', 12)).toBe('12 In Stock');
  });

  it('falls back to the plain label for in stock when quantity is zero', () => {
    expect(getAvailabilityLabel('in_stock', 0)).toBe('In Stock');
  });

  it('falls back to the plain label for in stock when quantity is omitted', () => {
    expect(getAvailabilityLabel('in_stock')).toBe('In Stock');
  });

  it('ignores a positive quantity for statuses other than in stock', () => {
    expect(getAvailabilityLabel('low_stock', 3)).toBe('Low Stock');
    expect(getAvailabilityLabel('out_of_stock', 3)).toBe('Out of Stock');
    expect(getAvailabilityLabel('partially_stocked', 3)).toBe('Partially Stocked');
  });
});

describe('getAvailabilityColor', () => {
  it('maps in stock to success', () => {
    expect(getAvailabilityColor('in_stock')).toBe('success');
  });

  it('maps low stock and out of stock to critical', () => {
    expect(getAvailabilityColor('low_stock')).toBe('critical');
    expect(getAvailabilityColor('out_of_stock')).toBe('critical');
  });

  it('maps partially stocked to secondary', () => {
    expect(getAvailabilityColor('partially_stocked')).toBe('secondary');
  });

  it('falls back to secondary for an unrecognized value', () => {
    expect(getAvailabilityColor('unknown')).toBe('secondary');
  });
});

describe('getAvailabilityDescription', () => {
  it('gives every status a distinct explanation', () => {
    const descriptions = [
      getAvailabilityDescription('in_stock'),
      getAvailabilityDescription('low_stock'),
      getAvailabilityDescription('out_of_stock'),
      getAvailabilityDescription('partially_stocked'),
    ];

    expect(descriptions.every((description) => Boolean(description))).toBe(true);
    expect(new Set(descriptions).size).toBe(4);
  });

  it('returns undefined for an unrecognized value', () => {
    expect(getAvailabilityDescription('unknown')).toBeUndefined();
  });
});
