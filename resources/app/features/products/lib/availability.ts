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

export const getAvailabilityLabel = (status: AvailabilityStatus): string => {
  const labels: Record<AvailabilityStatus, string> = {
    in_stock: __('In Stock', 'kirki-ecommerce'),
    low_stock: __('Low Stock', 'kirki-ecommerce'),
    out_of_stock: __('Out of Stock', 'kirki-ecommerce'),
    partially_stocked: __('Partially Stocked', 'kirki-ecommerce'),
  };

  return labels[status];
};

const AVAILABILITY_COLORS: Record<AvailabilityStatus, 'secondary' | 'critical'> = {
  in_stock: 'secondary',
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
export const getAvailabilityColor = (status: string): 'secondary' | 'critical' =>
  AVAILABILITY_COLORS[status as AvailabilityStatus] ?? 'secondary';
