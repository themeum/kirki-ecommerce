import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';

export const CouponStatusSchema = z.enum([
  'active',
  'scheduled',
  'inactive',
  'expired',
]);

export type CouponStatus = z.infer<typeof CouponStatusSchema>;

export const CouponDiscountTypeSchema = z.enum([
  'amount-off',
  'free-shipping',
  'buy-x-get-y',
]);

export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;

export const CouponMethodSchema = z.enum(['code', 'automatic']);

export type CouponMethod = z.infer<typeof CouponMethodSchema>;

export const CouponDiscountTargetSchema = z.enum(['order', 'products']);

export type CouponDiscountTarget = z.infer<typeof CouponDiscountTargetSchema>;

export const CouponDiscountValueTypeSchema = z.enum(['fixed', 'percentage']);

export type CouponDiscountValueType = z.infer<
  typeof CouponDiscountValueTypeSchema
>;

export const CouponCollectionRefSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type CouponCollectionRef = z.infer<typeof CouponCollectionRefSchema>;

export const CouponSchema = z.object({
  id: z.number(),
  method: CouponMethodSchema,
  title: z.string(),
  code: z.string().nullish(),
  discount_type: CouponDiscountTypeSchema,
  discount_target: CouponDiscountTargetSchema.nullish(),
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  discount_amount: MoneyAmountSchema.nullish(),
  eligible_item_type: z.enum(['specific-products', 'specific-categories', 'all-products']).nullish(),
  spend_condition_type: z.enum(['min-cart-amount', 'min-items']).nullish(),
  spend_condition_value: z.number().nullish(),
  reward_quantity: z.number().nullish(),
  reward_value: z.number().nullish(),
  start_datetime: z.string().nullish(),
  has_end_datetime: z.boolean().default(false),
  end_datetime: z.string().nullish(),
  target_countries: z.array(z.string()).nullish(),
  first_time_buyer_only: z.boolean().default(false),
  customer_eligibility: z.enum(['specific-customers', 'specific-groups', 'all']).default('all'),
  exclude_customers: z.boolean().default(false),
  has_usage_limit: z.boolean().default(false),
  usage_limit: z.number().nullish(),
  has_customer_limit: z.boolean().default(false),
  customer_limit: z.number().nullish(),
  current_usage_count: z.number().default(0),
  is_active: z.boolean().default(true),
  status: CouponStatusSchema,
  created_by: z.number().nullish(),
  updated_by: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export type Coupon = z.infer<typeof CouponSchema>;

export const CouponListItemSchema = CouponSchema.pick({
  id: true,
  method: true,
  title: true,
  code: true,
  discount_type: true,
  discount_target: true,
  discount_value_type: true,
  discount_amount: true,
  eligible_item_type: true,
  spend_condition_type: true,
  spend_condition_value: true,
  reward_quantity: true,
  reward_value: true,
  start_datetime: true,
  has_end_datetime: true,
  end_datetime: true,
  has_usage_limit: true,
  usage_limit: true,
  current_usage_count: true,
  is_active: true,
  status: true,
  created_at: true,
  updated_at: true,
});

export type CouponListItem = z.infer<typeof CouponListItemSchema>;

export type { ProductAttribute } from '@/schemas/catalog/attribute';
export type { InventoryVariant, ProductVariant } from '@/schemas/catalog/variant';

