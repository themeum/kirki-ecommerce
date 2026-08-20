import { z } from 'zod';

import {
  CouponDiscountTargetSchema,
  CouponDiscountTypeSchema,
  CouponDiscountValueTypeSchema,
  CouponMethodSchema,
} from '@/features/coupons/schemas/catalog/coupon';
import { END_OF_DAY_TIME, formatAtomDateTime, mergeDateAndTime, START_OF_DAY_TIME } from '@/libs/date';
import { isEmptyValue, prepareFormSchema, required, requiredWhen } from '@/libs/zod';
import { MoneyAmountSchema } from '@/schemas/shared/api';
import { __ } from '@/wpi18n';

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
});

const CouponFormSchema = prepareFormSchema(CouponFormShape).transform((values) => {
  const isAmountOff = values.discount_type === 'amount-off';

  return {
    method: values.method,
    title: values.title,
    code: values.method === 'code' ? values.code?.trim() || null : null,
    discount_type: values.discount_type,
    discount_target: isAmountOff ? values.discount_target ?? null : null,
    discount_value_type: isAmountOff ? values.discount_value_type ?? null : null,
    discount_amount:
      isAmountOff && values.discount_amount ? values.discount_amount : null,
    start_datetime: formatAtomDateTime(mergeDateAndTime(
      values.start_date ?? '',
      values.start_time ?? START_OF_DAY_TIME,
    )),
    has_end_datetime: values.has_end_datetime,
    end_datetime: formatAtomDateTime(
      values.has_end_datetime
        ? mergeDateAndTime(values.end_date ?? '', values.end_time ?? END_OF_DAY_TIME)
        : null,
    ),
    has_usage_limit: values.has_usage_limit,
    usage_limit: values.has_usage_limit ? values.usage_limit : null,
    has_customer_limit: values.has_customer_limit,
    customer_limit: values.has_customer_limit ? values.customer_limit : null,
  };
});

type CouponFormPayload = z.output<typeof CouponFormSchema>;

type CouponFormInput = z.input<typeof CouponFormSchema>;

export { type CouponFormInput, type CouponFormPayload, CouponFormSchema };

