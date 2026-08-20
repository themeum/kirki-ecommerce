import type { ProductVariantSelection } from '@/features/products';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseDateString, parseString } from '@/types/list-state';
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
  fulfillment_status?: string;
  payment_status?: string;
  from_date?: string | null;
  to_date?: string | null;
};

const orderListFilterConfig: ListFilterConfig<OrderListFilter> = {
  keys: [
    'search',
    'fulfillment_status',
    'payment_status',
    'from_date',
    'to_date',
  ],
  parsers: {
    search: { parse: parseString },
    fulfillment_status: { parse: parseString },
    payment_status: { parse: parseString },
    from_date: { parse: parseDateString },
    to_date: { parse: parseDateString },
  },
};

const orderListOptions: UseListParamsOptions<OrderListFilter> = {
  defaults: {
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 10,
  },
  filter: orderListFilterConfig,
};

const fulfillmentStatusOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'unfulfilled', title: __('Unfulfilled', 'kirki-ecommerce') },
  { value: 'processing', title: __('Processing', 'kirki-ecommerce') },
  { value: 'shipped', title: __('Shipped', 'kirki-ecommerce') },
  { value: 'delivered', title: __('Delivered', 'kirki-ecommerce') },
  { value: 'on-hold', title: __('On hold', 'kirki-ecommerce') },
  { value: 'cancelled', title: __('Cancelled', 'kirki-ecommerce') },
  { value: 'returned', title: __('Returned', 'kirki-ecommerce') },
];

const paymentStatusOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'paid', title: __('Paid', 'kirki-ecommerce') },
  { value: 'unpaid', title: __('Unpaid', 'kirki-ecommerce') },
  { value: 'failed', title: __('Failed', 'kirki-ecommerce') },
  { value: 'refunding', title: __('Refunding', 'kirki-ecommerce') },
  { value: 'refunded', title: __('Refunded', 'kirki-ecommerce') },
];

export type { OrderListFilter };

export { fulfillmentStatusOptions, orderListFilterConfig, orderListOptions, paymentStatusOptions };

