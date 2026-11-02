import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEY, useAnalyticsLayout } from '@/features/analytics/hooks/use-analytics-layout';
import { DEFAULT_LAYOUT } from '@/features/analytics/lib/layout';

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown;

describe('useAnalyticsLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with the default layout and saves it', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
    expect(stored()).toEqual(DEFAULT_LAYOUT);
  });

  it('reads the saved layout', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ kpis: [{ key: 'orders', visible: true }], cards: [] }),
    );

    const { result } = renderHook(() => useAnalyticsLayout());

    expect(result.current.layout.kpis[0]).toEqual({ key: 'orders', visible: true });
  });

  it('uses the default layout when the saved value is not JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken');

    const { result } = renderHook(() => useAnalyticsLayout());

    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
  });

  it('hides and shows an item and saves the change', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    act(() => {
      result.current.setVisible('cards', 'sales_by_coupon_code', false);
      result.current.setVisible('kpis', 'net_sales', true);
    });

    expect(result.current.layout.cards.find((item) => item.key === 'sales_by_coupon_code')).toEqual(
      { key: 'sales_by_coupon_code', visible: false },
    );
    expect(result.current.layout.kpis.find((item) => item.key === 'net_sales')?.visible).toBe(true);
    expect(stored()).toEqual(result.current.layout);
  });

  it('does not hide the last item that is on in a group', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    act(() => {
      result.current.setVisible('kpis', 'gross_sales', false);
      result.current.setVisible('kpis', 'orders', false);
      result.current.setVisible('kpis', 'average_order_value', false);
      result.current.setVisible('kpis', 'returning_customer_rate', false);
    });

    expect(result.current.layout.kpis.filter((item) => item.visible)).toEqual([
      { key: 'returning_customer_rate', visible: true },
    ]);
  });

  it('moves an item in its group', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    act(() => {
      result.current.move('kpis', 1, 0);
    });

    expect(result.current.layout.kpis.slice(0, 2).map((item) => item.key)).toEqual([
      'orders',
      'gross_sales',
    ]);
    expect(result.current.layout.cards).toEqual(DEFAULT_LAYOUT.cards);
  });

  it('sets the amount format and saves it', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    expect(result.current.layout.amounts).toBe('short');

    act(() => {
      result.current.setAmounts('long');
    });

    expect(result.current.layout.amounts).toBe('long');
    expect(stored()).toMatchObject({ amounts: 'long' });
  });

  it('resets to the default layout', () => {
    const { result } = renderHook(() => useAnalyticsLayout());

    act(() => {
      result.current.move('cards', 14, 0);
      result.current.setVisible('cards', 'taxes_by_region', false);
      result.current.setAmounts('long');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.layout).toEqual(DEFAULT_LAYOUT);
    expect(stored()).toEqual(DEFAULT_LAYOUT);
  });

  it('works when local storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useAnalyticsLayout());

    act(() => {
      result.current.setVisible('cards', 'inventory_health', false);
    });

    expect(result.current.layout.cards[14]).toEqual({ key: 'inventory_health', visible: false });
  });
});
