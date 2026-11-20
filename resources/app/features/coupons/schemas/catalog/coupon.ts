import { z } from 'zod';

import { CategorySchema } from '@/features/categories/schemas/catalog/category';
import { CustomerInfoSchema } from '@/features/customers/schemas/catalog/customer';
import { ProductListItemWithVariantsSchema } from '@/features/products/schemas/catalog/product';
import { MoneyAmountSchema } from '@/schemas/shared/api';
import { RegionSchema } from '@/schemas/shared/region';

const CouponStatusSchema = z.enum(['active', 'scheduled', 'inactive', 'expired']);

type CouponStatus = z.infer<typeof CouponStatusSchema>;

const CouponDiscountTypeSchema = z.enum(['amount-off', 'free-shipping', 'buy-x-get-y']);

type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;

const CouponMethodSchema = z.enum(['code', 'automatic']);

type CouponMethod = z.infer<typeof CouponMethodSchema>;

const CouponDiscountTargetSchema = z.enum(['order', 'products']);

type CouponDiscountTarget = z.infer<typeof CouponDiscountTargetSchema>;

const CouponEligibleItemTypeSchema = z.enum([
  'all-products',
  'specific-products',
  'specific-categories',
]);

type CouponEligibleItemType = z.infer<typeof CouponEligibleItemTypeSchema>;

const CouponTargetCountryTypeSchema = z.enum(['all-countries', 'specific-countries']);

type CouponTargetCountryType = z.infer<typeof CouponTargetCountryTypeSchema>;

const CouponCustomerIncludeEligibilitySchema = z.enum([
  'everyone',
  'customers',
  'guests',
  'specific-customers',
  'specific-groups',
]);

type CouponCustomerIncludeEligibility = z.infer<typeof CouponCustomerIncludeEligibilitySchema>;

const CouponCustomerExcludeEligibilitySchema = z.enum([
  'none',
  'customers',
  'guests',
  'specific-customers',
  'specific-groups',
]);

type CouponCustomerExcludeEligibility = z.infer<typeof CouponCustomerExcludeEligibilitySchema>;

const CouponDiscountValueTypeSchema = z.enum(['fixed', 'percentage']);

type CouponDiscountValueType = z.infer<typeof CouponDiscountValueTypeSchema>;

const CouponCollectionRefSchema = z.object({
  id: z.number(),
  title: z.string(),
});

type CouponCollectionRef = z.infer<typeof CouponCollectionRefSchema>;

const CouponSchema = z.object({
  id: z.number(),
  method: CouponMethodSchema,
  title: z.string(),
  code: z.string().nullish(),
  discount_type: CouponDiscountTypeSchema,
  discount_target: CouponDiscountTargetSchema.nullish(),
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  base_discount_amount: MoneyAmountSchema.nullish(),
  base_discount_amount_money_object: z.any(),
  display_discount_amount: MoneyAmountSchema.nullish(),
  display_discount_amount_money_object: z.any(),
  eligible_item_type: CouponEligibleItemTypeSchema.nullish(),
  spend_condition_type: z.enum(['min-cart-amount', 'min-items']).nullish(),
  spend_condition_value: z.number().nullish(),
  reward_quantity: z.number().nullish(),
  reward_value: z.number().nullish(),
  start_datetime: z.string().nullish(),
  has_end_datetime: z.boolean().default(false),
  end_datetime: z.string().nullish(),
  target_country_type: CouponTargetCountryTypeSchema.default('all-countries'),
  target_countries: z.array(RegionSchema).nullish(),
  first_time_buyer_only: z.boolean().default(false),
  customer_include_eligibility: CouponCustomerIncludeEligibilitySchema.default('everyone'),
  customer_exclude_eligibility: CouponCustomerExcludeEligibilitySchema.default('none'),
  has_usage_limit: z.boolean().default(false),
  usage_limit: z.number().nullish(),
  has_customer_limit: z.boolean().default(false),
  customer_limit: z.number().nullish(),
  current_usage_count: z.number().default(0),
  is_active: z.boolean().default(true),
  status: CouponStatusSchema,
  products: z.array(ProductListItemWithVariantsSchema).default([]),
  categories: z.array(CategorySchema).default([]),
  customers: z.array(CustomerInfoSchema).default([]),
  excluded_customers: z.array(CustomerInfoSchema).default([]),
  created_by: z.number().nullish(),
  updated_by: z.number().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

type Coupon = z.infer<typeof CouponSchema>;

const CouponListItemSchema = CouponSchema.pick({
  id: true,
  method: true,
  title: true,
  code: true,
  discount_type: true,
  discount_target: true,
  discount_value_type: true,
  base_discount_amount: true,
  base_discount_amount_money_object: true,
  display_discount_amount: true,
  display_discount_amount_money_object: true,
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

type CouponListItem = z.infer<typeof CouponListItemSchema>;

export {
  CouponCollectionRefSchema,
  CouponCustomerExcludeEligibilitySchema,
  CouponCustomerIncludeEligibilitySchema,
  CouponDiscountTargetSchema,
  CouponDiscountTypeSchema,
  CouponDiscountValueTypeSchema,
  CouponEligibleItemTypeSchema,
  CouponListItemSchema,
  CouponMethodSchema,
  CouponSchema,
  CouponStatusSchema,
  CouponTargetCountryTypeSchema,
};

export type {
  Coupon,
  CouponCollectionRef,
  CouponCustomerExcludeEligibility,
  CouponCustomerIncludeEligibility,
  CouponDiscountTarget,
  CouponDiscountType,
  CouponDiscountValueType,
  CouponEligibleItemType,
  CouponListItem,
  CouponMethod,
  CouponStatus,
  CouponTargetCountryType,
};
