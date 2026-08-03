export type OrderLineDisplay = {
  variantId: number;
  productTitle: string;
  variantLabel?: string;
  thumbnail?: string | null;
  unitPrice: number;
};

export type OrderLineRow = {
  index: number;
  quantity: number;
  display: OrderLineDisplay;
};
