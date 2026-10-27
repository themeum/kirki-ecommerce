import { z } from 'zod';

import type { AnalyticsCards, AnalyticsKpis } from '@/features/analytics/schemas/catalog/analytics';

type KpiKey = keyof AnalyticsKpis;
type CardKey = keyof AnalyticsCards;
type LayoutGroup = 'kpis' | 'cards';
type AmountFormat = 'short' | 'long';

type LayoutItem<K extends string> = {
  key: K;
  visible: boolean;
};

type AnalyticsLayout = {
  kpis: LayoutItem<KpiKey>[];
  cards: LayoutItem<CardKey>[];
  amounts: AmountFormat;
};

type LayoutKey<G extends LayoutGroup> = G extends 'kpis' ? KpiKey : CardKey;

const KPI_KEYS: KpiKey[] = [
  'gross_sales',
  'orders',
  'average_order_value',
  'returning_customer_rate',
  'net_sales',
  'total_sales',
  'items_ordered',
  'discounts',
  'new_customers',
  'customers',
  'shipping_charges',
];

const DEFAULT_VISIBLE_KPIS = 4;

const CARD_KEYS: CardKey[] = [
  'total_sales_over_time',
  'total_sales_breakdown',
  'sales_by_product',
  'sales_by_category',
  'average_order_value_over_time',
  'orders_over_time',
  'orders_by_fulfillment_status',
  'new_vs_returning_customers',
  'sales_by_coupon_code',
  'orders_by_time_of_day',
  'sales_by_location',
  'sales_by_payment_method',
  'taxes_by_region',
  'shipping_charges_by_method',
  'inventory_health',
];

const DEFAULT_LAYOUT: AnalyticsLayout = {
  kpis: KPI_KEYS.map((key, index) => ({ key, visible: index < DEFAULT_VISIBLE_KPIS })),
  cards: CARD_KEYS.map((key) => ({ key, visible: true })),
  amounts: 'short',
};

const StoredItemSchema = z.object({ key: z.string(), visible: z.boolean() });

const StoredLayoutSchema = z.object({
  kpis: z.array(StoredItemSchema),
  cards: z.array(StoredItemSchema),
  amounts: z.unknown(),
});

const normalizeGroup = <K extends string>(
  stored: z.infer<typeof StoredItemSchema>[],
  defaults: LayoutItem<K>[],
): LayoutItem<K>[] => {
  const known = new Map(defaults.map((item) => [item.key as string, item]));
  const seen = new Set<string>();
  const items: LayoutItem<K>[] = [];

  stored.forEach((item) => {
    const fallback = known.get(item.key);

    if (!fallback || seen.has(item.key)) {
      return;
    }

    seen.add(item.key);
    items.push({ key: fallback.key, visible: item.visible });
  });

  defaults.forEach((item) => {
    if (!seen.has(item.key)) {
      items.push({ ...item });
    }
  });

  if (!items.some((item) => item.visible)) {
    items[0] = { ...items[0], visible: true };
  }

  return items;
};

const normalizeLayout = (raw: unknown): AnalyticsLayout => {
  const parsed = StoredLayoutSchema.safeParse(raw);

  if (!parsed.success) {
    return DEFAULT_LAYOUT;
  }

  return {
    kpis: normalizeGroup(parsed.data.kpis, DEFAULT_LAYOUT.kpis),
    cards: normalizeGroup(parsed.data.cards, DEFAULT_LAYOUT.cards),
    amounts: parsed.data.amounts === 'long' ? 'long' : DEFAULT_LAYOUT.amounts,
  };
};

export { CARD_KEYS, DEFAULT_LAYOUT, KPI_KEYS, normalizeLayout };
export type { AmountFormat, AnalyticsLayout, CardKey, KpiKey, LayoutGroup, LayoutItem, LayoutKey };
