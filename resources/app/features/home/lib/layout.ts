import { z } from 'zod';

import { type ApiRangeKey, KPI_KEYS, type KpiKey } from '@/features/analytics';

type HomePeriod = 'month' | 'week' | 'today' | 'all';
type ActionKey =
  'create_order' | 'view_live_site' | 'add_product' | 'create_coupon' | 'add_customer';
type SectionKey =
  'key_numbers' | 'recent_orders' | 'top_products' | 'restock_soon' | 'needs_attention';
type HomeLayoutGroup = 'actions' | 'kpis' | 'sections';

type HomeLayoutItem<K extends string> = {
  key: K;
  visible: boolean;
};

type HomeLayout = {
  period: HomePeriod;
  actions: HomeLayoutItem<ActionKey>[];
  kpis: HomeLayoutItem<KpiKey>[];
  sections: HomeLayoutItem<SectionKey>[];
};

type HomeLayoutKey<G extends HomeLayoutGroup> = G extends 'actions'
  ? ActionKey
  : G extends 'kpis'
    ? KpiKey
    : SectionKey;

const HOME_PERIODS: HomePeriod[] = ['month', 'week', 'today', 'all'];

const PERIOD_RANGES: Record<HomePeriod, ApiRangeKey> = {
  month: 'month_to_date',
  week: 'week_to_date',
  today: 'today',
  all: 'all_time',
};

const getPeriodParams = (period: HomePeriod) => ({
  range: PERIOD_RANGES[period],
  from: null,
  to: null,
  compare: 'none' as const,
  compare_from: null,
  compare_to: null,
});

const GROUP_LIMITS: Record<HomeLayoutGroup, number | null> = {
  actions: 3,
  kpis: 4,
  sections: null,
};

const DEFAULT_KPIS: KpiKey[] = ['total_sales', 'net_sales', 'orders', 'items_ordered'];

const DEFAULT_HOME_LAYOUT: HomeLayout = {
  period: 'month',
  actions: [
    { key: 'create_order', visible: true },
    { key: 'view_live_site', visible: true },
    { key: 'add_product', visible: false },
    { key: 'create_coupon', visible: false },
    { key: 'add_customer', visible: false },
  ],
  kpis: [
    ...DEFAULT_KPIS.map((key) => ({ key, visible: true })),
    ...KPI_KEYS.filter((key) => !DEFAULT_KPIS.includes(key)).map((key) => ({
      key,
      visible: false,
    })),
  ],
  sections: [
    { key: 'key_numbers', visible: true },
    { key: 'recent_orders', visible: true },
    { key: 'top_products', visible: true },
    { key: 'restock_soon', visible: false },
    { key: 'needs_attention', visible: true },
  ],
};

const StoredItemSchema = z.object({ key: z.string(), visible: z.boolean() });

const StoredHomeLayoutSchema = z.object({
  period: z.unknown(),
  actions: z.array(StoredItemSchema).catch([]),
  kpis: z.array(StoredItemSchema).catch([]),
  sections: z.array(StoredItemSchema).catch([]),
});

const isAtLimit = <K extends string>(items: HomeLayoutItem<K>[], limit: number | null) => {
  return limit !== null && items.filter((item) => item.visible).length >= limit;
};

const normalizeGroup = <K extends string>(
  stored: z.infer<typeof StoredItemSchema>[],
  defaults: HomeLayoutItem<K>[],
  limit: number | null,
): HomeLayoutItem<K>[] => {
  const known = new Map(defaults.map((item) => [item.key as string, item]));
  const seen = new Set<string>();
  const items: HomeLayoutItem<K>[] = [];

  stored.forEach((item) => {
    const fallback = known.get(item.key);

    if (!fallback || seen.has(item.key)) {
      return;
    }

    seen.add(item.key);
    items.push({ key: fallback.key, visible: item.visible && !isAtLimit(items, limit) });
  });

  defaults.forEach((item) => {
    if (!seen.has(item.key)) {
      items.push({ key: item.key, visible: item.visible && !isAtLimit(items, limit) });
    }
  });

  return items;
};

const normalizeHomeLayout = (raw: unknown): HomeLayout => {
  const parsed = StoredHomeLayoutSchema.safeParse(raw);

  if (!parsed.success) {
    return DEFAULT_HOME_LAYOUT;
  }

  const period = HOME_PERIODS.find((value) => value === parsed.data.period);

  return {
    period: period ?? DEFAULT_HOME_LAYOUT.period,
    actions: normalizeGroup(parsed.data.actions, DEFAULT_HOME_LAYOUT.actions, GROUP_LIMITS.actions),
    kpis: normalizeGroup(parsed.data.kpis, DEFAULT_HOME_LAYOUT.kpis, GROUP_LIMITS.kpis),
    sections: normalizeGroup(
      parsed.data.sections,
      DEFAULT_HOME_LAYOUT.sections,
      GROUP_LIMITS.sections,
    ),
  };
};

export {
  DEFAULT_HOME_LAYOUT,
  getPeriodParams,
  GROUP_LIMITS,
  HOME_PERIODS,
  isAtLimit,
  normalizeHomeLayout,
  PERIOD_RANGES,
};
export type {
  ActionKey,
  HomeLayout,
  HomeLayoutGroup,
  HomeLayoutItem,
  HomeLayoutKey,
  HomePeriod,
  SectionKey,
};
