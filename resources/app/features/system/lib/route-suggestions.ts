import { RouteConfig } from '@/config/route-config';
import { __ } from '@/wpi18n';

type DestinationId =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'coupons'
  | 'customers'
  | 'analytics'
  | 'settings';

type Destination = {
  id: DestinationId;
  label: string;
  link: string;
  keywords: string[];
};

const MIN_PARTIAL_LENGTH = 3;
const MAX_TYPO_DISTANCE = 1;
const MAX_SUGGESTIONS = 3;

const getDestinations = (): Destination[] => [
  {
    id: 'dashboard',
    label: __('Dashboard', 'kirki-ecommerce'),
    link: RouteConfig.Home.buildLink(),
    keywords: ['home', 'dashboard', 'overview'],
  },
  {
    id: 'products',
    label: __('Products', 'kirki-ecommerce'),
    link: RouteConfig.Products.buildLink(),
    keywords: ['products', 'product', 'items', 'catalog', 'variants'],
  },
  {
    id: 'orders',
    label: __('Orders', 'kirki-ecommerce'),
    link: RouteConfig.Orders.buildLink(),
    keywords: ['orders', 'order', 'sales', 'shipping', 'tracking'],
  },
  {
    id: 'inventory',
    label: __('Inventory', 'kirki-ecommerce'),
    link: RouteConfig.Inventory.buildLink(),
    keywords: ['inventory', 'stock', 'warehouse'],
  },
  {
    id: 'coupons',
    label: __('Coupons', 'kirki-ecommerce'),
    link: RouteConfig.Coupons.buildLink(),
    keywords: ['coupons', 'coupon', 'discounts', 'discount', 'promo'],
  },
  {
    id: 'customers',
    label: __('Customers', 'kirki-ecommerce'),
    link: RouteConfig.Customers.buildLink(),
    keywords: ['customers', 'customer', 'clients', 'users', 'groups'],
  },
  {
    id: 'analytics',
    label: __('Analytics', 'kirki-ecommerce'),
    link: RouteConfig.Analytics.buildLink(),
    keywords: ['analytics', 'reports', 'report', 'stats', 'statistics'],
  },
  {
    id: 'settings',
    label: __('Settings', 'kirki-ecommerce'),
    link: RouteConfig.Settings.buildLink(),
    keywords: ['settings', 'setting', 'config', 'tax', 'payments', 'email', 'checkout'],
  },
];

const getEditDistance = (a: string, b: string): number => {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }

  return previous[b.length];
};

const scoreSegment = (segment: string, keyword: string): number => {
  if (segment === keyword) {
    return 3;
  }

  const isPartialMatch =
    segment.length >= MIN_PARTIAL_LENGTH &&
    (keyword.startsWith(segment) || segment.startsWith(keyword));

  if (isPartialMatch) {
    return 2;
  }

  if (
    segment.length >= MIN_PARTIAL_LENGTH &&
    getEditDistance(segment, keyword) <= MAX_TYPO_DISTANCE
  ) {
    return 1;
  }

  return 0;
};

const scoreDestination = (segments: string[], destination: Destination): number =>
  segments.reduce(
    (best, segment) =>
      Math.max(best, ...destination.keywords.map((keyword) => scoreSegment(segment, keyword))),
    0,
  );

const getRouteSuggestions = (pathname: string): Destination[] => {
  const segments = pathname
    .toLowerCase()
    .split(/[/\-_\s]+/)
    .filter(Boolean);

  return getDestinations()
    .map((destination) => ({ destination, score: scoreDestination(segments, destination) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ destination }) => destination);
};

export { type Destination, type DestinationId, getDestinations, getRouteSuggestions };
