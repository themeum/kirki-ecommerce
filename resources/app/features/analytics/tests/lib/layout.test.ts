import { describe, expect, it } from 'vitest';

import {
  CARD_KEYS,
  DEFAULT_LAYOUT,
  KPI_KEYS,
  normalizeLayout,
} from '@/features/analytics/lib/layout';

const visibleKeys = (items: { key: string; visible: boolean }[]) =>
  items.filter((item) => item.visible).map((item) => item.key);

describe('DEFAULT_LAYOUT', () => {
  it('has the 11 key metrics with the first 4 on', () => {
    expect(DEFAULT_LAYOUT.kpis.map((item) => item.key)).toEqual(KPI_KEYS);
    expect(visibleKeys(DEFAULT_LAYOUT.kpis)).toEqual([
      'gross_sales',
      'orders',
      'average_order_value',
      'returning_customer_rate',
    ]);
  });

  it('shows short amounts', () => {
    expect(DEFAULT_LAYOUT.amounts).toBe('short');
  });

  it('has the 15 cards all on, in page order', () => {
    expect(DEFAULT_LAYOUT.cards.map((item) => item.key)).toEqual(CARD_KEYS);
    expect(CARD_KEYS).toHaveLength(15);
    expect(visibleKeys(DEFAULT_LAYOUT.cards)).toEqual(CARD_KEYS);
  });
});

describe('normalizeLayout', () => {
  it('keeps the saved amount format', () => {
    expect(normalizeLayout({ kpis: [], cards: [], amounts: 'long' }).amounts).toBe('long');
    expect(normalizeLayout({ kpis: [], cards: [], amounts: 'short' }).amounts).toBe('short');
  });

  it('uses short amounts for a layout saved before the amount format, or an unknown format', () => {
    const layout = normalizeLayout({ kpis: [{ key: 'orders', visible: true }], cards: [] });

    expect(layout.amounts).toBe('short');
    expect(layout.kpis[0]).toEqual({ key: 'orders', visible: true });
    expect(normalizeLayout({ kpis: [], cards: [], amounts: 'huge' }).amounts).toBe('short');
  });

  it('gives the default layout for a value that is not a layout', () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout('broken')).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout({ kpis: 'x', cards: [] })).toEqual(DEFAULT_LAYOUT);
  });

  it('keeps the saved order and state', () => {
    const layout = normalizeLayout({
      kpis: [
        { key: 'orders', visible: true },
        { key: 'gross_sales', visible: false },
      ],
      cards: [{ key: 'inventory_health', visible: true }],
    });

    expect(layout.kpis.slice(0, 2)).toEqual([
      { key: 'orders', visible: true },
      { key: 'gross_sales', visible: false },
    ]);
    expect(layout.cards[0]).toEqual({ key: 'inventory_health', visible: true });
  });

  it('adds missing keys at the end with their default state', () => {
    const layout = normalizeLayout({
      kpis: [{ key: 'shipping_charges', visible: true }],
      cards: [
        { key: 'inventory_health', visible: false },
        { key: 'sales_by_product', visible: true },
      ],
    });

    expect(layout.kpis).toHaveLength(11);
    expect(layout.kpis[1]).toEqual({ key: 'gross_sales', visible: true });
    expect(layout.kpis[10]).toEqual({ key: 'customers', visible: false });
    expect(layout.cards).toHaveLength(15);
    expect(layout.cards[2]).toEqual({ key: 'total_sales_over_time', visible: true });
  });

  it('drops unknown keys and duplicates', () => {
    const layout = normalizeLayout({
      kpis: [
        { key: 'profit', visible: true },
        { key: 'orders', visible: true },
        { key: 'orders', visible: false },
      ],
      cards: [],
    });

    expect(layout.kpis.map((item) => item.key)).not.toContain('profit');
    expect(layout.kpis.filter((item) => item.key === 'orders')).toEqual([
      { key: 'orders', visible: true },
    ]);
  });

  it('turns on the first item of a group with none on', () => {
    const layout = normalizeLayout({
      kpis: KPI_KEYS.map((key) => ({ key, visible: false })),
      cards: CARD_KEYS.map((key) => ({ key, visible: false })),
    });

    expect(visibleKeys(layout.kpis)).toEqual(['gross_sales']);
    expect(visibleKeys(layout.cards)).toEqual(['total_sales_over_time']);
  });
});
