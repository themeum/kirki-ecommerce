import type { TextColor } from '@/components/ui/text';
import { __, sprintf } from '@/wpi18n';

type StockText = {
  text: string;
  color: TextColor;
};

type ProductStock = {
  availability_status?: string | null;
  track_inventory?: boolean | null;
  inventory?: number | null;
};

export const getStockText = (product: ProductStock): StockText | null => {
  if (!product.availability_status) {
    return null;
  }

  if (product.availability_status === 'out_of_stock') {
    return { text: __('Out of stock', 'kirki-ecommerce'), color: 'critical' };
  }

  if (product.track_inventory && product.inventory && product.inventory > 0) {
    return {
      /* translators: %d: number of units left in stock */
      text: sprintf(__('%d left in stock', 'kirki-ecommerce'), product.inventory),
      color: product.availability_status === 'low_stock' ? 'critical' : 'secondary',
    };
  }

  return { text: __('In stock', 'kirki-ecommerce'), color: 'secondary' };
};
