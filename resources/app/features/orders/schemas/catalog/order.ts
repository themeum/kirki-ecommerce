import { z } from 'zod';

import { CouponDiscountTargetSchema, CouponDiscountTypeSchema, CouponDiscountValueTypeSchema } from '@/features/coupons';
import { MoneyObjectSchema } from '@/schemas/shared/api';
import { MediaRefSchema } from '@/schemas/shared/media';

export const OrderStatusSchema = z.enum([
  'pending',
  'unpaid_processing',
  'paid_unfulfilled',
  'paid_processing',
  'paid_shipped',
  'shipped_unpaid',
  'delivered_unpaid',
  'completed',
  'on_hold_paid',
  'on_hold_unpaid',
  'paid_cancelled',
  'unpaid_cancelled',
  'failed_cancelled',
  'failed_unfulfilled',
  'failed_processing',
  'failed_shipped',
  'failed_delivered',
  'failed_on_hold',
  'refund_requested',
  'refund_in_progress',
  'refunded',
  'refund_declined',
  'returned_pending_refund',
  'refunded_partially',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentStatusSchema = z.enum(['paid', 'unpaid', 'failed', 'refunding', 'refunded']);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const FulfillmentStatusSchema = z.enum([
  'unfulfilled',
  'processing',
  'shipped',
  'delivered',
  'on-hold',
  'cancelled',
  'returned',
]);

export type FulfillmentStatus = z.infer<typeof FulfillmentStatusSchema>;

export const OrderTrackingSchema = z.object({
  carrier: z.string().nullish(),
  tracking_number: z.string().nullish(),
  tracking_url: z.string().nullish(),
});

export type OrderTracking = z.infer<typeof OrderTrackingSchema>;

export const RefundStatusSchema = z.enum(['pending', 'completed', 'cancelled']);

export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export const RefundTypeSchema = z.enum(['full', 'partial']);

export type RefundType = z.infer<typeof RefundTypeSchema>;

export const RefundSchema = z.object({
  id: z.number(),
  invoiced_amount_money_object: MoneyObjectSchema,
  type: RefundTypeSchema,
  reason: z.string().nullish(),
  transaction_id: z.string().nullish(),
  status: RefundStatusSchema,
  created_at: z.string().nullish(),
  created_by: z.number().nullish(),
});

export type Refund = z.infer<typeof RefundSchema>;

export const ShippingTypeSchema = z.enum(['flat_rate', 'local_pickup', 'weight']);

export type ShippingType = z.infer<typeof ShippingTypeSchema>;

export const OrderAddressSchema = z.object({
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  address_line1: z.string().nullish(),
  address_line2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  postal_code: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
});

export type OrderAddress = z.infer<typeof OrderAddressSchema>;

export const OrderTaxLineSchema = z.object({
  name: z.string(),
  rate: z.number(),
  invoiced_amount_money_object: MoneyObjectSchema,
  base_amount_money_object: MoneyObjectSchema,
});

export type OrderTaxLine = z.infer<typeof OrderTaxLineSchema>;

export const OrderCalculationTaxLineSchema = z.object({
  name: z.string(),
  rate: z.number(),
  base_amount_money_object: MoneyObjectSchema,
});

export type OrderCalculationTaxLine = z.infer<typeof OrderCalculationTaxLineSchema>;

export const OrderCouponSchema = z.object({
  id: z.number(),
  coupon_id: z.number().nullish(),
  code: z.string(),
  title: z.string().nullish(),
  discount_type: CouponDiscountTypeSchema,
  discount_target: CouponDiscountTargetSchema.nullish(),
  invoiced_discount_amount_money_object: MoneyObjectSchema,
  base_discount_amount_money_object: MoneyObjectSchema,
  usage_reversed_at: z.string().nullish(),
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  discount_amount_percentage: z.number().nullish(),
  invoiced_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
  base_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
});

export type OrderCoupon = z.infer<typeof OrderCouponSchema>;

export const OrderAppliedProductCouponSchema = z.object({
  code: z.string(),
  title: z.string().nullish(),
  invoiced_discount_amount_money_object: MoneyObjectSchema,
  base_discount_amount_money_object: MoneyObjectSchema,
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  discount_amount_percentage: z.number().nullish(),
  invoiced_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
  base_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
});

export type OrderAppliedProductCoupon = z.infer<typeof OrderAppliedProductCouponSchema>;

export const OrderCalculationCouponSchema = z.object({
  code: z.string(),
  title: z.string().nullish(),
  discount_type: CouponDiscountTypeSchema,
  discount_target: CouponDiscountTargetSchema.nullish(),
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  discount_amount_percentage: z.number().nullish(),
  base_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
  base_discount_amount_money_object: MoneyObjectSchema,
});

export type OrderCalculationCoupon = z.infer<typeof OrderCalculationCouponSchema>;

export const OrderCalculationAppliedCouponSchema = z.object({
  code: z.string(),
  title: z.string().nullish(),
  discount_value_type: CouponDiscountValueTypeSchema.nullish(),
  discount_amount_percentage: z.number().nullish(),
  base_discount_amount_fixed_money_object: MoneyObjectSchema.nullish(),
  base_discount_amount_money_object: MoneyObjectSchema,
});

export type OrderCalculationAppliedCoupon = z.infer<typeof OrderCalculationAppliedCouponSchema>;

export const OrderLineItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  variant_id: z.number(),
  product_name: z.string().nullish(),
  variant_name: z.string().nullish(),
  sku: z.string().nullish(),
  image: MediaRefSchema.nullish(),
  quantity: z.number(),
  invoiced_subtotal_exclusive_money_object: MoneyObjectSchema,
  invoiced_subtotal_inclusive_money_object: MoneyObjectSchema,
  base_subtotal_exclusive_money_object: MoneyObjectSchema,
  base_subtotal_inclusive_money_object: MoneyObjectSchema,
  invoiced_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  invoiced_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  base_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  base_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  invoiced_unit_price_exclusive_money_object: MoneyObjectSchema,
  invoiced_unit_price_inclusive_money_object: MoneyObjectSchema,
  base_unit_price_exclusive_money_object: MoneyObjectSchema,
  base_unit_price_inclusive_money_object: MoneyObjectSchema,
  invoiced_unit_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  invoiced_unit_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  base_unit_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  base_unit_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  invoiced_tax_total_money_object: MoneyObjectSchema,
  base_tax_total_money_object: MoneyObjectSchema,
  tax_lines: z.array(OrderTaxLineSchema).default([]),
  applied_product_coupons: z.array(OrderAppliedProductCouponSchema).default([]),
});

export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

export const OrderCalculationItemSchema = z.object({
  id: z.number(),
  quantity: z.number(),
  base_subtotal_exclusive_money_object: MoneyObjectSchema,
  base_subtotal_inclusive_money_object: MoneyObjectSchema,
  base_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  base_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  base_unit_price_exclusive_money_object: MoneyObjectSchema,
  base_unit_price_inclusive_money_object: MoneyObjectSchema,
  base_unit_strikethrough_price_exclusive_money_object: MoneyObjectSchema.nullish(),
  base_unit_strikethrough_price_inclusive_money_object: MoneyObjectSchema.nullish(),
  applied_product_coupons: z.array(OrderCalculationAppliedCouponSchema).default([]),
});

export type OrderCalculationItem = z.infer<typeof OrderCalculationItemSchema>;

export const OrderSchema = z.object({
  id: z.number(),
  uuid: z.string().nullish(),
  order_number: z.string().nullish(),
  invoice_number: z.string().nullish(),

  customer_id: z.number().nullish(),
  customer: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
  }),

  status: OrderStatusSchema,
  fulfillment_status: FulfillmentStatusSchema,
  is_refund_initiated: z.boolean(),
  is_manual: z.boolean(),
  currency_code: z.string(),
  is_tax_inclusive: z.boolean(),

  totals: z.object({
    invoiced_items_subtotal_exclusive_money_object: MoneyObjectSchema,
    invoiced_items_subtotal_inclusive_money_object: MoneyObjectSchema,
    base_items_subtotal_exclusive_money_object: MoneyObjectSchema,
    base_items_subtotal_inclusive_money_object: MoneyObjectSchema,
    invoiced_order_discount_money_object: MoneyObjectSchema,
    base_order_discount_money_object: MoneyObjectSchema,
    invoiced_order_total_exclusive_money_object: MoneyObjectSchema,
    invoiced_order_total_inclusive_money_object: MoneyObjectSchema,
    base_order_total_exclusive_money_object: MoneyObjectSchema,
    base_order_total_inclusive_money_object: MoneyObjectSchema,
    invoiced_tax_total_money_object: MoneyObjectSchema,
    base_tax_total_money_object: MoneyObjectSchema,
    invoiced_shipping_amount_money_object: MoneyObjectSchema,
    base_shipping_amount_money_object: MoneyObjectSchema,
    invoiced_shipping_strikethrough_money_object: MoneyObjectSchema,
    base_shipping_strikethrough_money_object: MoneyObjectSchema,
    invoiced_total_money_object: MoneyObjectSchema,
    base_total_money_object: MoneyObjectSchema,
  }),

  tax_lines: z.array(OrderTaxLineSchema).default([]),
  coupons: z.array(OrderCouponSchema).default([]),

  items_count: z.number(),
  items: z.array(OrderLineItemSchema).default([]),

  shipping_address: OrderAddressSchema,
  is_billing_same_as_shipping: z.boolean().nullish(),
  billing_address: OrderAddressSchema,

  payment_provider: z.string().nullable(),
  payment_provider_name: z.string().nullish(),
  payment_provider_icon: z.string().nullish(),
  payment_provider_is_offline: z.boolean().nullish(),
  payment_status: PaymentStatusSchema,
  shipping_method: z.string().nullish(),
  shipping_method_name: z.string().nullish(),
  shipping_method_type: z.string().nullish(),
  customer_notes: z.string().nullish(),
  admin_notes: z.string().nullish(),
  flags: z.array(z.string()).nullish(),
  shipping_tracking: OrderTrackingSchema,
  refunds: z.array(RefundSchema).default([]),
  estimated_delivery_date: z.string().nullish(),
  archived_at: z.string().nullish(),
  created_at: z.string(),
  cancelled_at: z.string().nullish(),
  paid_at: z.string().nullish(),
  shipped_at: z.string().nullish(),
  fulfilled_at: z.string().nullish(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrderListItemSchema = OrderSchema.pick({
  id: true,
  uuid: true,
  order_number: true,
  customer_id: true,
}).merge(
  z.object({
    customer_name: z.string().nullish(),
    customer_email: z.string().nullish(),
    is_manual: z.boolean(),
    quantity: z.number(),
    invoiced_total: z.union([z.number(), z.string()]),
    invoiced_total_money_object: MoneyObjectSchema,
    base_total: z.union([z.number(), z.string()]),
    base_total_money_object: MoneyObjectSchema,
    status: OrderStatusSchema,
    fulfillment_status: FulfillmentStatusSchema,
    is_refund_initiated: z.boolean(),
    payment_status: PaymentStatusSchema,
    payment_provider: z.string().nullish(),
    payment_provider_icon: z.string().nullish(),
    created_at: z.string(),
  }),
);

export type OrderListItem = z.infer<typeof OrderListItemSchema>;

export const OrderCalculationSchema = z.object({
  is_tax_inclusive: z.boolean(),

  totals: z.object({
    base_items_subtotal_exclusive_money_object: MoneyObjectSchema,
    base_items_subtotal_inclusive_money_object: MoneyObjectSchema,
    base_order_discount_money_object: MoneyObjectSchema,
    base_order_total_exclusive_money_object: MoneyObjectSchema,
    base_order_total_inclusive_money_object: MoneyObjectSchema,
    base_tax_total_money_object: MoneyObjectSchema,
    base_shipping_amount_money_object: MoneyObjectSchema,
    base_shipping_strikethrough_money_object: MoneyObjectSchema,
    base_total_money_object: MoneyObjectSchema,
  }),

  tax_lines: z.array(OrderCalculationTaxLineSchema).default([]),
  coupons: z.array(OrderCalculationCouponSchema).default([]),

  items_count: z.number(),
  items: z.array(OrderCalculationItemSchema).default([]),

  available_shipping_methods: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        name: z.string(),
        type: ShippingTypeSchema,
        base_cost_money_object: MoneyObjectSchema,
      }),
    )
    .default([]),

  shipping_method: z.union([z.number(), z.string()]).nullish(),
});

export type OrderCalculation = z.infer<typeof OrderCalculationSchema>;
