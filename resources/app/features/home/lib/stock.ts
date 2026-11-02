import type { BadgeVariant } from '@/components/ui/badge';
import type { TopProduct } from '@/features/home/schemas/catalog/dashboard-overview';
import { __, sprintf } from '@/wpi18n';

type StockBadge = {
  text: string;
  variant: BadgeVariant;
};

export const getStockBadge = (
  product: Pick<TopProduct, 'availability_status' | 'track_inventory' | 'inventory'>,
): StockBadge | null => {
  if (product.availability_status === null) {
    return null;
  }

  if (product.availability_status === 'out_of_stock') {
    return { text: __('Out of stock', 'kirki-ecommerce'), variant: 'destructive' };
  }

  if (product.track_inventory && product.inventory > 0) {
    return {
      /* translators: %d: number of units left in stock */
      text: sprintf(__('%d left in stock', 'kirki-ecommerce'), product.inventory),
      variant: product.availability_status === 'low_stock' ? 'warning' : 'default',
    };
  }

  return { text: __('In stock', 'kirki-ecommerce'), variant: 'success' };
};
