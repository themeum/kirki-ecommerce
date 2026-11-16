import { useEffect, useState } from 'react';

import {
  DEFAULT_HOME_LAYOUT,
  GROUP_LIMITS,
  type HomeLayout,
  type HomeLayoutGroup,
  type HomeLayoutItem,
  type HomeLayoutKey,
  type HomePeriod,
  isAtLimit,
  normalizeHomeLayout,
} from '@/features/home/lib/layout';

const HOME_LAYOUT_STORAGE_KEY = 'kirki-ecommerce:home:layout';

const readStoredHomeLayout = (): HomeLayout => {
  try {
    const raw = window.localStorage.getItem(HOME_LAYOUT_STORAGE_KEY);

    return raw ? normalizeHomeLayout(JSON.parse(raw)) : DEFAULT_HOME_LAYOUT;
  } catch {
    return DEFAULT_HOME_LAYOUT;
  }
};

const useHomeLayout = () => {
  const [layout, setLayout] = useState<HomeLayout>(readStoredHomeLayout);

  useEffect(() => {
    try {
      window.localStorage.setItem(HOME_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      return;
    }
  }, [layout]);

  const setVisible = <G extends HomeLayoutGroup>(
    group: G,
    key: HomeLayoutKey<G>,
    visible: boolean,
  ) => {
    setLayout((current) => {
      const items = current[group] as HomeLayoutItem<HomeLayoutKey<G>>[];

      if (visible && isAtLimit(items, GROUP_LIMITS[group])) {
        return current;
      }

      return {
        ...current,
        [group]: items.map((item) => (item.key === key ? { ...item, visible } : item)),
      };
    });
  };

  const move = (group: HomeLayoutGroup, from: number, to: number) => {
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

  const setPeriod = (period: HomePeriod) => {
    setLayout((current) => ({ ...current, period }));
  };

  const reset = () => {
    setLayout((current) => ({ ...DEFAULT_HOME_LAYOUT, period: current.period }));
  };

  return { layout, setVisible, move, setPeriod, reset };
};

type HomeLayoutControls = ReturnType<typeof useHomeLayout>;

export { HOME_LAYOUT_STORAGE_KEY, useHomeLayout };
export type { HomeLayoutControls };
