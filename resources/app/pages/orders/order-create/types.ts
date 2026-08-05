import type { MoneyObject } from '@/schemas/shared/api';

export type OrderRowDisplay = {
  variantId: number;
  productTitle: string;
  variantLabel?: string;
  thumbnail?: string | null;
  regularPrice: MoneyObject;
  salePrice?: MoneyObject | null;
};

export type ProductPickerItem = {
  label: string;
  inStock: boolean;
  row: OrderRowDisplay;
};

export type OrderItemRow = {
  index: number;
  quantity: number;
  display: OrderRowDisplay;
};
