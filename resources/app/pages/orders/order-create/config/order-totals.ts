import type { OrderLineRow } from '@/pages/orders/order-create/types';

export type OrderTotals = {
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
};

export const formatCurrency = (amount: number, symbol = '$'): string =>
  `${symbol}${amount.toFixed(2)}`;

export const computeOrderTotals = (
  rows: OrderLineRow[],
  options: { discount?: number; shipping?: number; taxRate?: number } = {},
): OrderTotals => {
  const { discount = 0, shipping = 0, taxRate = 0.15 } = options;

  const itemCount = rows.reduce((sum, row) => sum + row.quantity, 0);
  const subtotal = rows.reduce(
    (sum, row) => sum + row.display.unitPrice * row.quantity,
    0,
  );
  const taxableAmount = Math.max(subtotal - discount, 0);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + shipping + tax;

  return { itemCount, subtotal, discount, shipping, tax, total };
};
