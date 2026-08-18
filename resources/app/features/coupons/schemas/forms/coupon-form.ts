import { format } from 'date-fns';
import { z } from 'zod';

import { CategorySchema } from '@/features/categories';
import { mergeDateTime } from '@/features/coupons/lib/coupon-datetime';
import type { CouponEligibleItemType } from '@/features/coupons/schemas/catalog/coupon';
import {
  CouponCustomerEligibilitySchema,
  CouponDiscountTargetSchema,
  CouponDiscountTypeSchema,
  CouponDiscountValueTypeSchema,
  CouponEligibleItemTypeSchema,
  CouponMethodSchema,
  CouponTargetCountryTypeSchema,
} from '@/features/coupons/schemas/catalog/coupon';
import { CustomerInfoSchema } from '@/features/customers/schemas/catalog/customer';
import { ProductSelectionSchema } from '@/features/products/schemas/catalog/product-selection';
import { DATE_FORMATS, END_OF_DAY_TIME, START_OF_DAY_TIME } from '@/libs/date';
import { isEmptyValue, prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { MoneyAmountSchema } from '@/schemas/shared/api';
import { RegionSchema } from '@/schemas/shared/region';
import { __ } from '@/wpi18n';

const isProductEligibility = (
  values: Record<string, unknown>,
  eligibleItemType: CouponEligibleItemType,
) =>
  values.discount_type === 'amount-off' &&
  values.discount_target === 'products' &&
  values.eligible_item_type === eligibleItemType;

const CouponFormShape = z.object({
  method: CouponMethodSchema.default('code'),
  title: required(z.string().max(255).default(''), __('Title is required', 'kirki-ecommerce')),
  code: requiredWhen(
    z.string().nullish().default(null),
    (values) => values.method === 'code' && !values.code,
    __('Coupon code is required', 'kirki-ecommerce'),
  ),
  discount_type: CouponDiscountTypeSchema.default('amount-off'),
  discount_target: CouponDiscountTargetSchema.nullish().default('order'),
  discount_value_type: requiredWhen(
    CouponDiscountValueTypeSchema.nullish().default(null),
    (values) => values.discount_type === 'amount-off' && isEmptyValue(values.discount_value_type),
    __('Discount type is required', 'kirki-ecommerce'),
  ),
  discount_amount: requiredWhen(
    MoneyAmountSchema.nullish(),
    (values) => {
      if (values.discount_type === 'amount-off' && isEmptyValue(values.discount_amount)) {
        return true;
      }

      if (Number(values.discount_amount) < 0) {
        return true;
      }

      if (values.discount_value_type === 'percentage' && Number(values.discount_amount) > 100) {
        return true;
      }

      return false;
    },
    (values) => {
      if (Number(values.discount_amount) < 0) {
        return __('Discount amount must be greater than or equal to 0', 'kirki-ecommerce')
      }

      if (values.discount_value_type === 'percentage' && Number(values.discount_amount) > 100) {
        return __('Percentage must be less than or equal to 100', 'kirki-ecommerce')
      }

      return __('Enter a valid discount amount', 'kirki-ecommerce')
    },
  ),
  start_date: required(z.string().default(''), __('Start date is required', 'kirki-ecommerce')),
  start_time: z.string().nullish().default(null),
  has_end_datetime: z.boolean().default(false),
  end_date: requiredWhen(
    z.string().nullish().default(null),
    (values) => Boolean(values.has_end_datetime) && isEmptyValue(values.end_date),
    __('End date is required', 'kirki-ecommerce'),
  ),
  end_time: z.string().nullish().default(null),
  has_usage_limit: z.boolean().default(false),
  usage_limit: requiredWhen(
    z.number().nullish().default(null),
    (values) => Boolean(values.has_usage_limit) && isEmptyValue(values.usage_limit),
    __('Usage limit required', 'kirki-ecommerce'),
  ),
  has_customer_limit: z.boolean().default(false),
  customer_limit: requiredWhen(
    z.number().nullish().default(null),
    (values) => Boolean(values.has_customer_limit) && isEmptyValue(values.customer_limit),
    __('Customer usage limit required', 'kirki-ecommerce'),
  ),
  eligible_item_type: requiredWhen(
    CouponEligibleItemTypeSchema.nullish().default('all-products'),
    (values) =>
      values.discount_type === 'amount-off' &&
      values.discount_target === 'products' &&
      isEmptyValue(values.eligible_item_type),
    __('Eligible items is required', 'kirki-ecommerce'),
  ),
  products: requiredWhen(
    z.array(ProductSelectionSchema).nullish().default([]),
    (values) =>
      isProductEligibility(values, 'specific-products') && isEmptyValue(values.products),
    __('Select at least one product', 'kirki-ecommerce'),
  ),
  categories: requiredWhen(
    z.array(CategorySchema).nullish().default([]),
    (values) =>
      isProductEligibility(values, 'specific-categories') && isEmptyValue(values.categories),
    __('Select at least one category', 'kirki-ecommerce'),
  ),
  target_country_type: CouponTargetCountryTypeSchema.default('all-countries'),
  target_countries: requiredWhen(
    z.array(RegionSchema).nullish().default([]),
    (values) =>
      values.target_country_type === 'specific-countries' &&
      isEmptyValue(values.target_countries),
    __('Select at least one region', 'kirki-ecommerce'),
  ),
  first_time_buyer_only: z.boolean().default(false),
  customer_include_eligibility: CouponCustomerEligibilitySchema.default('all'),
  include_customers: requiredWhen(
    z.array(CustomerInfoSchema).nullish().default([]),
    (values) =>
      values.customer_include_eligibility === 'specific-customers' &&
      isEmptyValue(values.include_customers),
    __('Select at least one customer', 'kirki-ecommerce'),
  ),
  customer_exclude_eligibility: CouponCustomerEligibilitySchema.default('none'),
  exclude_customers: requiredWhen(
    z.array(CustomerInfoSchema).nullish().default([]),
    (values) =>
      values.customer_exclude_eligibility === 'specific-customers' &&
      isEmptyValue(values.exclude_customers),
    __('Select at least one customer', 'kirki-ecommerce'),
  ),
});

/** Formats to the same ATOM string the wire layer expects — no Date object survives into the payload. */
const formatDateTime = (date: Date | null): string | null =>
  date ? format(date, DATE_FORMATS.ATOM) : null;

const CouponFormSchema = prepareFormSchema(CouponFormShape).transform((values) => {
  const isAmountOff = values.discount_type === 'amount-off';
  const isProductTarget = isAmountOff && values.discount_target === 'products';
  const eligibleItemType = isProductTarget ? values.eligible_item_type ?? null : null;

  return {
    method: values.method,
    title: values.title,
    code: values.method === 'code' ? values.code?.trim() || null : null,
    discount_type: values.discount_type,
    discount_target: isAmountOff ? values.discount_target ?? null : null,
    eligible_item_type: eligibleItemType,
    discount_value_type: isAmountOff ? values.discount_value_type ?? null : null,
    discount_amount:
      isAmountOff && values.discount_amount ? values.discount_amount : null,
    start_datetime: formatDateTime(mergeDateTime(
      values.start_date ?? '',
      values.start_time ?? START_OF_DAY_TIME,
    )),
    has_end_datetime: values.has_end_datetime,
    end_datetime: formatDateTime(
      values.has_end_datetime
        ? mergeDateTime(values.end_date ?? '', values.end_time ?? END_OF_DAY_TIME)
        : null,
    ),
    has_usage_limit: values.has_usage_limit,
    usage_limit: values.has_usage_limit ? values.usage_limit : null,
    has_customer_limit: values.has_customer_limit,
    customer_limit: values.has_customer_limit ? values.customer_limit : null,
    product_ids:
      eligibleItemType === 'specific-products'
        ? (values.products ?? []).map((product) => product.productId)
        : [],
    category_ids:
      eligibleItemType === 'specific-categories'
        ? (values.categories ?? []).map((category) => category.id)
        : [],
    target_country_type: values.target_country_type,
    target_countries:
      values.target_country_type === 'specific-countries'
        ? values.target_countries ?? []
        : null,
    first_time_buyer_only: values.first_time_buyer_only,
    customer_include_eligibility: values.customer_include_eligibility,
    customer_ids:
      values.customer_include_eligibility === 'specific-customers'
        ? (values.include_customers ?? []).map((customer) => customer.id)
        : [],
    customer_exclude_eligibility: values.customer_exclude_eligibility,
    exclude_customer_ids:
      values.customer_exclude_eligibility === 'specific-customers'
        ? (values.exclude_customers ?? []).map((customer) => customer.id)
        : [],
  };
});

type CouponFormPayload = z.output<typeof CouponFormSchema>;

type CouponFormInput = z.input<typeof CouponFormSchema>;

export { CouponFormSchema };
export type { CouponFormInput, CouponFormPayload };

