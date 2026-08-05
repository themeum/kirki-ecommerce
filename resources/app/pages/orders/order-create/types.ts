import type { ProductVariantSelection } from '@/components/shared/select-products-dialog/types';

export type OrderRowDisplay = ProductVariantSelection & {
  productId: number;
  productTitle: string;
};

export type OrderItem = {
  index: number;
  quantity: number;
  display: OrderRowDisplay;
};
