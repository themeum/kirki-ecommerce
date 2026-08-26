import type { TextColor } from '@/components/ui/text';
import { __ } from '@/wpi18n';

export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'partially_stocked';

type VariantStockInput = {
  trackInventory: boolean;
  inStock: boolean;
  availableQuantity: number;
  lowStockThreshold: number | null;
};

/**
 * Layer 1: a single variant's stock state. A variant's own threshold wins
 * when set; `null` falls back to the store default, `0` is an explicit
 * "never low" and does not fall back.
 */
export const resolveVariantStatus = (
  { trackInventory, inStock, availableQuantity, lowStockThreshold }: VariantStockInput,
  storeDefaultThreshold: number,
): AvailabilityStatus => {
  if (!trackInventory) {
    return inStock ? 'in_stock' : 'out_of_stock';
  }

  if (availableQuantity <= 0) {
    return 'out_of_stock';
  }

  const threshold = lowStockThreshold ?? storeDefaultThreshold;

  if (availableQuantity <= threshold) {
    return 'low_stock';
  }

  return 'in_stock';
};

/**
 * Layer 2: a set of variant statuses folded into one group-level status.
 * Order-independent — every OS wins over an empty read, else any LS wins,
 * else a mix of IS/OS reports PS, else IS. Returns null for an empty set
 * rather than defaulting to any of the four.
 */
export const resolveGroupStatus = (statuses: AvailabilityStatus[]): AvailabilityStatus | null => {
  if (statuses.length === 0) {
    return null;
  }

  if (statuses.every((status) => status === 'out_of_stock')) {
    return 'out_of_stock';
  }

  if (statuses.some((status) => status === 'low_stock')) {
    return 'low_stock';
  }

  if (statuses.some((status) => status === 'out_of_stock')) {
    return 'partially_stocked';
  }

  return 'in_stock';
};

/**
 * `quantity` is the summed available_quantity of tracked, in-stock variants
 * (0 for an untracked variant/group). Only `in_stock` ever gets a number —
 * a quantity of 0 falls back to the plain label rather than reading "0 In
 * Stock", which would look like there is no stock at all.
 */
export const getAvailabilityLabel = (status: AvailabilityStatus, quantity = 0): string => {
  if (status === 'in_stock' && quantity > 0) {
    return `${quantity} ${__('In Stock', 'kirki-ecommerce')}`;
  }

  const labels: Record<AvailabilityStatus, string> = {
    in_stock: __('In Stock', 'kirki-ecommerce'),
    low_stock: __('Low Stock', 'kirki-ecommerce'),
    out_of_stock: __('Out of Stock', 'kirki-ecommerce'),
    partially_stocked: __('Partially Stocked', 'kirki-ecommerce'),
  };

  return labels[status];
};

const AVAILABILITY_COLORS: Record<AvailabilityStatus, TextColor> = {
  in_stock: 'success',
  partially_stocked: 'secondary',
  low_stock: 'critical',
  out_of_stock: 'critical',
};

/**
 * Accepts a plain string, not just AvailabilityStatus, because the product
 * listing's status arrives from the API through a lenient schema that
 * tolerates backend drift — an unrecognized value falls back to 'secondary'
 * rather than throwing.
 */
export const getAvailabilityColor = (status: string): TextColor =>
  AVAILABILITY_COLORS[status as AvailabilityStatus] ?? 'secondary';

const AVAILABILITY_DESCRIPTIONS: Record<AvailabilityStatus, string> = {
  in_stock: __('All variants have enough quantity available for purchase.', 'kirki-ecommerce'),
  low_stock: __('At least one variant has reached its low stock threshold.', 'kirki-ecommerce'),
  out_of_stock: __('All variants are out of stock.', 'kirki-ecommerce'),
  partially_stocked: __('Some variants are in stock while others are out of stock.', 'kirki-ecommerce'),
};

/**
 * Accepts a plain string for the same reason as `getAvailabilityColor` — an
 * unrecognized status (backend drift) has no meaningful explanation, so this
 * returns undefined rather than a misleading fallback.
 */
export const getAvailabilityDescription = (status: string): string | undefined =>
  AVAILABILITY_DESCRIPTIONS[status as AvailabilityStatus];
