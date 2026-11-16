import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HOME_LAYOUT_STORAGE_KEY, useHomeLayout } from '@/features/home/hooks/use-home-layout';
import { DEFAULT_HOME_LAYOUT } from '@/features/home/lib/layout';

const stored = () =>
  JSON.parse(window.localStorage.getItem(HOME_LAYOUT_STORAGE_KEY) ?? 'null') as unknown;

const visibleKeys = (items: { key: string; visible: boolean }[]) =>
  items.filter((item) => item.visible).map((item) => item.key);

describe('useHomeLayout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with the default layout and saves it', () => {
    const { result } = renderHook(() => useHomeLayout());

    expect(result.current.layout).toEqual(DEFAULT_HOME_LAYOUT);
    expect(stored()).toEqual(DEFAULT_HOME_LAYOUT);
  });

  it('uses the default layout when the saved value is not JSON', () => {
    window.localStorage.setItem(HOME_LAYOUT_STORAGE_KEY, '{broken');

    const { result } = renderHook(() => useHomeLayout());

    expect(result.current.layout).toEqual(DEFAULT_HOME_LAYOUT);
  });

  it('keeps a hidden section and the period for the next visit', () => {
    const first = renderHook(() => useHomeLayout());

    act(() => {
      first.result.current.setVisible('sections', 'recent_orders', false);
      first.result.current.setPeriod('week');
    });
    first.unmount();

    const { result } = renderHook(() => useHomeLayout());

    expect(result.current.layout.period).toBe('week');
    expect(result.current.layout.sections[1]).toEqual({ key: 'recent_orders', visible: false });
  });

  it('does not turn on a fifth key number or a fourth quick action', () => {
    const { result } = renderHook(() => useHomeLayout());

    act(() => {
      result.current.setVisible('kpis', 'gross_sales', true);
      result.current.setVisible('actions', 'add_product', true);
      result.current.setVisible('actions', 'create_coupon', true);
    });

    expect(visibleKeys(result.current.layout.kpis)).toHaveLength(4);
    expect(visibleKeys(result.current.layout.actions)).toEqual([
      'create_order',
      'view_live_site',
      'add_product',
    ]);
  });

  it('turns off every section', () => {
    const { result } = renderHook(() => useHomeLayout());

    act(() => {
      DEFAULT_HOME_LAYOUT.sections.forEach((item) => {
        result.current.setVisible('sections', item.key, false);
      });
    });

    expect(visibleKeys(result.current.layout.sections)).toEqual([]);
  });

  it('moves an item in its group', () => {
    const { result } = renderHook(() => useHomeLayout());

    act(() => {
      result.current.move('actions', 2, 0);
    });

    expect(result.current.layout.actions[0].key).toBe('add_product');
  });

  it('resets to the default layout and keeps the period', () => {
    const { result } = renderHook(() => useHomeLayout());

    act(() => {
      result.current.setVisible('sections', 'recent_orders', false);
      result.current.setVisible('actions', 'add_product', true);
      result.current.setPeriod('today');
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.layout).toEqual({ ...DEFAULT_HOME_LAYOUT, period: 'today' });
  });

  it('works when local storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useHomeLayout());

    act(() => {
      result.current.setVisible('sections', 'top_products', false);
    });

    expect(result.current.layout.sections[2]).toEqual({ key: 'top_products', visible: false });
  });
});
