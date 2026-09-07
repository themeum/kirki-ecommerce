import type { TextColor } from '@/components/ui/text';
import type { InventoryVariant } from '@/features/products';
import { getAvailabilityColor } from '@/features/products/lib/availability';

const EMPTY_VALUE = '--';

const CRITICAL_STATUSES = ['low_stock', 'out_of_stock'];

type InventoryCell = {
  text: string;
  color: TextColor;
};

/**
 * An untracked variant has no meaningful quantity, so it reports the status
 * label the backend resolved. A tracked variant reports its quantity, and only
 * borrows the status colour when that status is one worth flagging — a healthy
 * count reads as data, not as a success message.
 */
const resolveAvailableCell = (variant: InventoryVariant): InventoryCell => {
  const status = variant.availability_status ?? '';

  if (!variant.track_inventory) {
    return {
      text: variant.availability_label || EMPTY_VALUE,
      color: getAvailabilityColor(status),
    };
  }

  return {
    text: String(variant.available_quantity),
    color: CRITICAL_STATUSES.includes(status) ? getAvailabilityColor(status) : 'primary',
  };
};

/**
 * A committed count only means something for a variant whose stock is counted,
 * and only when something is actually committed. Every other case is a dash
 * rather than a `0` that reads as a real measurement.
 */
const resolveCommittedCell = (variant: InventoryVariant): InventoryCell => {
  if (!variant.track_inventory || !variant.committed_quantity) {
    return { text: EMPTY_VALUE, color: 'primary' };
  }

  return { text: String(variant.committed_quantity), color: 'primary' };
};

export { EMPTY_VALUE, resolveAvailableCell, resolveCommittedCell };
export type { InventoryCell };
