import type { ProductVariantSelection } from '@/features/products';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseString } from '@/types/list-state';
import type { SuggestionOption } from '@/types/pages/common';
import { __ } from '@/wpi18n';

export type OrderRowDisplay = ProductVariantSelection & {
  productId: number;
  productTitle: string;
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

const orderListFilterConfig: ListFilterConfig<OrderListFilter> = {
  keys: ['search', 'status', 'payment_status', 'shipping_method'],
  parsers: {
    search: { parse: parseString },
    status: { parse: parseString },
    payment_status: { parse: parseString },
    shipping_method: { parse: parseString },
  },
};

const orderListOptions: UseListParamsOptions<OrderListFilter> = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: orderListFilterConfig,
};

const orderStatusOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'order-placed', title: __('Order placed', 'kirki-ecommerce') },
  { value: 'order-processing', title: __('Order processing', 'kirki-ecommerce') },
  { value: 'order-on-hold', title: __('Order on hold', 'kirki-ecommerce') },
  { value: 'order-shipped', title: __('Order shipped', 'kirki-ecommerce') },
  { value: 'order-delivered', title: __('Order delivered', 'kirki-ecommerce') },
  { value: 'payment-failed', title: __('Payment failed', 'kirki-ecommerce') },
  { value: 'order-cancelled', title: __('Order cancelled', 'kirki-ecommerce') },
  { value: 'refund-requested', title: __('Refund requested', 'kirki-ecommerce') },
  { value: 'refund-in-progress', title: __('Refund in progress', 'kirki-ecommerce') },
  { value: 'refunded', title: __('Refunded', 'kirki-ecommerce') },
  { value: 'refund-declined', title: __('Refund declined', 'kirki-ecommerce') },
  { value: 'order-returned', title: __('Order returned', 'kirki-ecommerce') },
];

const paymentStatusOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'paid', title: __('Paid', 'kirki-ecommerce') },
  { value: 'unpaid', title: __('Unpaid', 'kirki-ecommerce') },
  { value: 'pending', title: __('Pending', 'kirki-ecommerce') },
  { value: 'processing', title: __('Processing', 'kirki-ecommerce') },
  { value: 'failed', title: __('Failed', 'kirki-ecommerce') },
  { value: 'cancelled', title: __('Cancelled', 'kirki-ecommerce') },
  { value: 'refunding', title: __('Refunding', 'kirki-ecommerce') },
  { value: 'refunded', title: __('Refunded', 'kirki-ecommerce') },
];

export type { OrderListFilter };

export { orderListFilterConfig, orderListOptions, orderStatusOptions, paymentStatusOptions };
