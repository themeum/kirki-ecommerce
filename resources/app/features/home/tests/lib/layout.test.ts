import { describe, expect, it } from 'vitest';

import { KPI_KEYS } from '@/features/analytics';
import {
  DEFAULT_HOME_LAYOUT,
  normalizeHomeLayout,
  PERIOD_RANGES,
} from '@/features/home/lib/layout';

const visibleKeys = (items: { key: string; visible: boolean }[]) =>
  items.filter((item) => item.visible).map((item) => item.key);

describe('DEFAULT_HOME_LAYOUT', () => {
  it('starts with This month', () => {
    expect(DEFAULT_HOME_LAYOUT.period).toBe('month');
  });

  it('has Create order and View live site on, in this order', () => {
    expect(DEFAULT_HOME_LAYOUT.actions.map((item) => item.key)).toEqual([
      'create_order',
      'view_live_site',
      'add_product',
      'create_coupon',
      'add_customer',
    ]);
    expect(visibleKeys(DEFAULT_HOME_LAYOUT.actions)).toEqual(['create_order', 'view_live_site']);
  });

  it('has the 11 key numbers with the current Home numbers on first', () => {
    expect(DEFAULT_HOME_LAYOUT.kpis.map((item) => item.key)).toEqual([
      'total_sales',
      'net_sales',
      'orders',
      'items_ordered',
      'gross_sales',
      'average_order_value',
      'returning_customer_rate',
      'discounts',
      'new_customers',
      'customers',
      'shipping_charges',
    ]);
    expect(DEFAULT_HOME_LAYOUT.kpis).toHaveLength(KPI_KEYS.length);
    expect(visibleKeys(DEFAULT_HOME_LAYOUT.kpis)).toEqual([
      'total_sales',
      'net_sales',
      'orders',
      'items_ordered',
    ]);
  });

  it('has every section on except Restock soon', () => {
    expect(DEFAULT_HOME_LAYOUT.sections.map((item) => item.key)).toEqual([
      'key_numbers',
      'recent_orders',
      'top_products',
      'restock_soon',
      'needs_attention',
    ]);
    expect(visibleKeys(DEFAULT_HOME_LAYOUT.sections)).toEqual([
      'key_numbers',
      'recent_orders',
      'top_products',
      'needs_attention',
    ]);
  });
});

describe('PERIOD_RANGES', () => {
  it('maps each period to its Analytics range preset', () => {
    expect(PERIOD_RANGES).toEqual({
      month: 'month_to_date',
      week: 'week_to_date',
      today: 'today',
      all: 'all_time',
    });
  });
});

describe('normalizeHomeLayout', () => {
  it('gives the default layout for a value that is not a layout', () => {
    expect(normalizeHomeLayout(null)).toEqual(DEFAULT_HOME_LAYOUT);
    expect(normalizeHomeLayout('broken')).toEqual(DEFAULT_HOME_LAYOUT);
  });

  it('keeps the saved order, state and period', () => {
    const layout = normalizeHomeLayout({
      period: 'week',
      actions: [
        { key: 'add_product', visible: true },
        { key: 'create_order', visible: false },
      ],
      kpis: [],
      sections: [{ key: 'needs_attention', visible: true }],
    });

    expect(layout.period).toBe('week');
    expect(layout.actions.slice(0, 2)).toEqual([
      { key: 'add_product', visible: true },
      { key: 'create_order', visible: false },
    ]);
    expect(layout.sections[0]).toEqual({ key: 'needs_attention', visible: true });
  });

  it('keeps Long amounts and uses Short for a missing or unknown amount format', () => {
    expect(normalizeHomeLayout({ ...DEFAULT_HOME_LAYOUT, amounts: 'long' }).amounts).toBe('long');
    expect(normalizeHomeLayout({ ...DEFAULT_HOME_LAYOUT, amounts: 'tiny' }).amounts).toBe('short');
    expect(
      normalizeHomeLayout({
        period: 'week',
        actions: DEFAULT_HOME_LAYOUT.actions,
        kpis: DEFAULT_HOME_LAYOUT.kpis,
        sections: DEFAULT_HOME_LAYOUT.sections,
      }).amounts,
    ).toBe('short');
  });

  it('uses This month for an unknown period', () => {
    expect(normalizeHomeLayout({ period: 'decade' }).period).toBe('month');
  });

  it('ignores unknown keys and appends missing keys with their default state', () => {
    const layout = normalizeHomeLayout({
      sections: [
        { key: 'goal', visible: true },
        { key: 'top_products', visible: false },
      ],
    });

    expect(layout.sections).toEqual([
      { key: 'top_products', visible: false },
      { key: 'key_numbers', visible: true },
      { key: 'recent_orders', visible: true },
      { key: 'restock_soon', visible: false },
      { key: 'needs_attention', visible: true },
    ]);
  });

  it('keeps only the first 4 key numbers and the first 3 quick actions that are on', () => {
    const layout = normalizeHomeLayout({
      kpis: KPI_KEYS.slice(0, 6).map((key) => ({ key, visible: true })),
      actions: [
        { key: 'add_customer', visible: true },
        { key: 'create_coupon', visible: true },
        { key: 'add_product', visible: true },
        { key: 'create_order', visible: true },
      ],
    });

    expect(visibleKeys(layout.kpis)).toEqual(KPI_KEYS.slice(0, 4));
    expect(visibleKeys(layout.actions)).toEqual(['add_customer', 'create_coupon', 'add_product']);
  });

  it('lets every section and every quick action be off', () => {
    const layout = normalizeHomeLayout({
      actions: DEFAULT_HOME_LAYOUT.actions.map((item) => ({ ...item, visible: false })),
      sections: DEFAULT_HOME_LAYOUT.sections.map((item) => ({ ...item, visible: false })),
    });

    expect(visibleKeys(layout.actions)).toEqual([]);
    expect(visibleKeys(layout.sections)).toEqual([]);
  });
});
