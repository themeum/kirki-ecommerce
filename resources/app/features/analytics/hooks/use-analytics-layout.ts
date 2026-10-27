import { useEffect, useState } from 'react';

import {
  type AmountFormat,
  type AnalyticsLayout,
  DEFAULT_LAYOUT,
  type LayoutGroup,
  type LayoutItem,
  type LayoutKey,
  normalizeLayout,
} from '@/features/analytics/lib/layout';

const STORAGE_KEY = 'kirki-ecommerce:analytics:layout';

const readStoredLayout = (): AnalyticsLayout => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    return raw ? normalizeLayout(JSON.parse(raw)) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
};

const canHideItem = <K extends string>(items: LayoutItem<K>[], key: K) => {
  return items.some((item) => item.visible && item.key !== key);
};

const useAnalyticsLayout = () => {
  const [layout, setLayout] = useState<AnalyticsLayout>(readStoredLayout);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      return;
    }
  }, [layout]);

  const setVisible = <G extends LayoutGroup>(group: G, key: LayoutKey<G>, visible: boolean) => {
    setLayout((current) => {
      const items = current[group] as LayoutItem<LayoutKey<G>>[];

      if (!visible && !canHideItem(items, key)) {
        return current;
      }

      return {
        ...current,
        [group]: items.map((item) => (item.key === key ? { ...item, visible } : item)),
      };
    });
  };

  const move = (group: LayoutGroup, from: number, to: number) => {
    setLayout((current) => {
      const items = [...current[group]];
      const [moved] = items.splice(from, 1);

      if (!moved) {
        return current;
      }

      items.splice(to, 0, moved);

      return { ...current, [group]: items };
    });
  };

  const setAmounts = (amounts: AmountFormat) => {
    setLayout((current) => ({ ...current, amounts }));
  };

  const reset = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  return { layout, setVisible, move, setAmounts, reset };
};

type AnalyticsLayoutControls = ReturnType<typeof useAnalyticsLayout>;

export { canHideItem, STORAGE_KEY, useAnalyticsLayout };
export type { AnalyticsLayoutControls };
