import type { OrderCalculation } from '@/features/orders/schemas/catalog/order';
import type { ProductVariantSelection } from '@/features/products';
import type { MoneyObject } from '@/schemas/shared/api';

export type OrderRowDisplay = ProductVariantSelection & {
  productId: number;
  productTitle: string;
  storedQuantity?: number;
  storedSubtotal?: MoneyObject;
  isReachable?: boolean;
};

export type OrderItem = {
  index: number;
  quantity: number;
  display: OrderRowDisplay;
};

type OrderListFilter = {
  search?: string;
  status?: string;
  payment_status?: string;
  shipping_method?: string;
  from_date?: string | null;
  to_date?: string | null;
};

type PaymentSummaryTotals = Pick<
  OrderCalculation['totals'],
  | 'base_items_subtotal_money_object'
  | 'base_order_total_money_object'
  | 'base_tax_total_money_object'
  | 'base_shipping_amount_money_object'
  | 'base_total_money_object'
>;

type PaymentSummaryCoupon = Pick<
  OrderCalculation['coupons'][number],
  | 'code'
  | 'title'
  | 'discount_value_type'
  | 'discount_amount_percentage'
  | 'base_discount_amount_money_object'
>;

type PaymentSummaryTaxLine = Pick<
  OrderCalculation['tax_lines'][number],
  'name' | 'rate' | 'base_amount_money_object'
>;

type PaymentSummary = {
  totals?: PaymentSummaryTotals;
  coupons?: PaymentSummaryCoupon[];
  taxLines?: PaymentSummaryTaxLine[];
  itemsCount?: number;
  shippingMethodName?: string | null;
  isTaxInclusive?: boolean;
};

export type {
  OrderListFilter,
  PaymentSummary,
  PaymentSummaryCoupon,
  PaymentSummaryTaxLine,
  PaymentSummaryTotals,
};
