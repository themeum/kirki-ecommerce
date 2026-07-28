import { z } from 'zod';

import { MoneyAmountSchema } from '@/schemas/shared/api';

export const CouponStatusSchema = z.enum([
  'active',
  'scheduled',
  'inactive',
  'expired',
]);

export type CouponStatus = z.infer<typeof CouponStatusSchema>;

export const CouponCollectionRefSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type CouponCollectionRef = z.infer<typeof CouponCollectionRefSchema>;

export const CouponSchema = z.object({
  id: z.number(),
  method: z.enum(['code', 'automatic']),
  title: z.string(),
  code: z.string().nullish(),
  discount_type: z.enum(['amount-off', 'free-shipping', 'buy-x-get-y']),
  discount_target: z.enum(['order', 'products']).nullish(),
  discount_value_type: z.enum(['fixed', 'percentage']).nullish(),
  discount_amount: MoneyAmountSchema.nullish(),
  eligible_item_type: z.enum(['specific-products', 'specific-categories', 'all-products']).nullish(),
  spend_condition_type: z.enum(['min-cart-amount', 'min-items']).nullish(),
  spend_condition_value: z.number().nullish(),
  reward_quantity: z.number().nullish(),
  reward_value: z.number().nullish(),
  start_date: z.string(),
  start_time: z.string().nullish(),
  has_end_date: z.boolean().default(false),
  end_date: z.string().nullish(),
  end_time: z.string().nullish(),
  target_countries: z.array(z.string()).nullish(),
  first_time_buyer_only: z.boolean().default(false),
  customer_eligibility: z.enum(['specific-customers', 'specific-groups', 'all']).default('all'),
  exclude_customers: z.boolean().default(false),
  has_usage_limit: z.boolean().default(false),
  usage_limit: z.number().nullish(),
  has_customer_limit: z.boolean().default(false),
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
  start_date: true,
  start_time: true,
  has_end_date: true,
  end_date: true,
  end_time: true,
  has_usage_limit: true,
  usage_limit: true,
  current_usage_count: true,
  is_active: true,
  status: true,
  created_at: true,
  updated_at: true,
})

export type CouponListItem = z.infer<typeof CouponListItemSchema>;

export type { ProductAttribute } from '@/schemas/catalog/attribute';
export type { InventoryVariant, ProductVariant } from '@/schemas/catalog/variant';

