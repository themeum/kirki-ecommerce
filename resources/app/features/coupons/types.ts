import type { UseListParamsOptions } from '@/hooks/use-list-params';
import type { ListFilterConfig } from '@/types/list-state';
import { parseString } from '@/types/list-state';
import type { SuggestionOption } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type CouponListFilter = {
  search?: string;
  status?: string;
  discount_type?: string;
  method?: string;
};

const couponListFilterConfig: ListFilterConfig<CouponListFilter> = {
  keys: ['search', 'status', 'discount_type', 'method'],
  parsers: {
    search: { parse: parseString },
    status: { parse: parseString },
    discount_type: { parse: parseString },
    method: { parse: parseString },
  },
};

const couponListOptions: UseListParamsOptions<CouponListFilter> = {
  defaults: {
    search: '',
    sort_by: 'id',
    sort_order: 'desc',
    page: 1,
    limit: 20,
  },
  filter: couponListFilterConfig,
};

const statusOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'active', title: __('Active', 'kirki-ecommerce') },
  { value: 'scheduled', title: __('Scheduled', 'kirki-ecommerce') },
  { value: 'inactive', title: __('Inactive', 'kirki-ecommerce') },
  { value: 'expired', title: __('Expired', 'kirki-ecommerce') },
];

const methodOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'code', title: __('Code', 'kirki-ecommerce') },
  { value: 'automatic', title: __('Automatic', 'kirki-ecommerce') },
];

const discountTypeOptions: SuggestionOption[] = [
  { value: 'all', title: __('All', 'kirki-ecommerce') },
  { value: 'amount-off', title: __('Amount Off', 'kirki-ecommerce') },
  { value: 'free-shipping', title: __('Free Shipping', 'kirki-ecommerce') },
  { value: 'buy-x-get-y', title: __('Buy X get Y', 'kirki-ecommerce') },
];

export type { CouponListFilter };

export {
  couponListFilterConfig,
  couponListOptions,
  discountTypeOptions,
  methodOptions,
  statusOptions,
};
