import { CustomerAddressSchema } from "@/schemas/catalog/customer";
import { MoneyAmountSchema, MoneyObjectSchema } from "@/schemas/shared/api";
import { MediaRefSchema } from "@/schemas/shared/media";
import z from "zod";

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
  invoiced_amount: MoneyAmountSchema,
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

export const OrderItemSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  order_number: z.string(),
  customer_id: z.number(),
  status: OrderStatusSchema,
  fulfillment_status: FulfillmentStatusSchema,
  is_refund_initiated: z.boolean(),
  currency_code: z.string(),
  totals: z.object({
    invoiced_subtotal: MoneyAmountSchema,
    invoiced_subtotal_money_object: MoneyObjectSchema,
    base_subtotal: MoneyAmountSchema,
    base_subtotal_money_object: MoneyObjectSchema,
    invoiced_shipping: MoneyAmountSchema,
    invoiced_shipping_money_object: MoneyObjectSchema,
    base_shipping: MoneyAmountSchema,
    base_shipping_money_object: MoneyObjectSchema,
    invoiced_discount: MoneyAmountSchema,
    invoiced_discount_money_object: MoneyObjectSchema,
    base_discount: MoneyAmountSchema,
    base_discount_money_object: MoneyObjectSchema,
    invoiced_tax: MoneyAmountSchema,
    invoiced_tax_money_object: MoneyObjectSchema,
    base_tax: MoneyAmountSchema,
    base_tax_money_object: MoneyObjectSchema,
    invoiced_total: MoneyAmountSchema,
    invoiced_total_money_object: MoneyObjectSchema,
    base_total: MoneyAmountSchema,
    base_total_money_object: MoneyObjectSchema,
  }),
  items_count: z.number(),
  items: z.array(z.object({
    id: z.number(),
    product_id: z.number(),
    variant_id: z.number(),
    product_name: z.string().nullish(),
    variant_name: z.string().nullish(),
    quantity: z.number(),
    invoiced_price: MoneyAmountSchema,
    invoiced_price_money_object: MoneyObjectSchema,
    base_price: MoneyAmountSchema,
    base_price_money_object: MoneyObjectSchema,
    invoiced_subtotal: MoneyAmountSchema,
    invoiced_subtotal_money_object: MoneyObjectSchema,
    base_subtotal: MoneyAmountSchema,
    base_subtotal_money_object: MoneyObjectSchema,
    invoiced_discount_amount: MoneyAmountSchema,
    invoiced_discount_amount_money_object: MoneyObjectSchema,
    base_discount_amount: MoneyAmountSchema,
    base_discount_amount_money_object: MoneyObjectSchema,
    invoiced_total: MoneyAmountSchema,
    invoiced_total_money_object: MoneyObjectSchema,
    base_total: MoneyAmountSchema,
    base_total_money_object: MoneyObjectSchema,
    tax_rate: z.number().nullish(),
    invoiced_tax_total: MoneyAmountSchema,
    invoiced_tax_total_money_object: MoneyObjectSchema,
    base_tax_total: MoneyAmountSchema,
    base_tax_total_money_object: MoneyObjectSchema,
    tax_breakdown: z.array(z.object({
      name: z.string(),
      rate: z.number(),
      base_amount: z.number()
    })).nullish(),
    sku: z.string().nullish(),
    image: MediaRefSchema.nullish(),
  })),
  shipping_address: CustomerAddressSchema.nullish(),
  is_billing_same_as_shipping: z.boolean(),
  billing_address: CustomerAddressSchema.nullish(),
  payment_provider: z.string(),
  payment_status: PaymentStatusSchema,
  shipping_method: z.string().nullish(),
  customer_notes: z.string().nullish(),
  admin_notes: z.string().nullish(),
  flags: z.array(z.string()).nullish(),
  shipping_tracking: OrderTrackingSchema,
  refunds: z.array(RefundSchema).nullish(),
  archived_at: z.string().nullish(),
  created_at: z.string()
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderListItemSchema = OrderItemSchema.pick({
  id: true,
  uuid: true,
  order_number: true,
  customer_id: true,
}).merge(z.object({
  quantity: z.number(),
  invoiced_total: MoneyAmountSchema,
  invoiced_total_money_object: MoneyObjectSchema,
  base_total: MoneyAmountSchema,
  base_total_money_object: MoneyObjectSchema,
  status: OrderStatusSchema,
  fulfillment_status: FulfillmentStatusSchema,
  is_refund_initiated: z.boolean(),
  payment_status: PaymentStatusSchema,
  payment_provider: z.string().nullish(),
  created_at: z.string()
}));

export type OrderListItem = z.infer<typeof OrderListItemSchema>;

export const OrderCalculationSchema = z.object({
  pricing: z.object({
    base_subtotal: MoneyAmountSchema,
    base_subtotal_money_object: MoneyObjectSchema,
    display_subtotal: MoneyAmountSchema,
    display_subtotal_money_object: MoneyObjectSchema,
    base_tax_total: MoneyAmountSchema,
    base_tax_total_money_object: MoneyObjectSchema,
    display_tax_total: MoneyAmountSchema,
    display_tax_total_money_object: MoneyObjectSchema,
    discount_details: z.unknown().nullish(),
    base_discount_total: MoneyAmountSchema,
    base_discount_total_money_object: MoneyObjectSchema,
    display_discount_total: MoneyAmountSchema,
    display_discount_total_money_object: MoneyObjectSchema,
    base_shipping_subtotal: MoneyAmountSchema,
    base_shipping_subtotal_money_object: MoneyObjectSchema,
    display_shipping_subtotal: MoneyAmountSchema,
    display_shipping_subtotal_money_object: MoneyObjectSchema,
    base_shipping_tax: MoneyAmountSchema,
    base_shipping_tax_money_object: MoneyObjectSchema,
    display_shipping_tax: MoneyAmountSchema,
    display_shipping_tax_money_object: MoneyObjectSchema,
    base_shipping_discount: MoneyAmountSchema,
    base_shipping_discount_money_object: MoneyObjectSchema,
    display_shipping_discount: MoneyAmountSchema,
    display_shipping_discount_money_object: MoneyObjectSchema,
    base_shipping_total: MoneyAmountSchema,
    base_shipping_total_money_object: MoneyObjectSchema,
    display_shipping_total: MoneyAmountSchema,
    display_shipping_total_money_object: MoneyObjectSchema,
    base_total: MoneyAmountSchema,
    base_total_money_object: MoneyObjectSchema,
    display_total: MoneyAmountSchema,
    display_total_money_object: MoneyObjectSchema
  }),
  items_count: z.number(),
  items: z.array(z.object({
    id: z.number(),
    quantity: z.number(),
    base_subtotal: MoneyAmountSchema,
    base_subtotal_money_object: MoneyObjectSchema,
    display_subtotal: MoneyAmountSchema,
    display_subtotal_money_object: MoneyObjectSchema,
    tax_rate: z.number().nullish(),
    base_tax_amount: MoneyAmountSchema,
    base_tax_amount_money_object: MoneyObjectSchema,
    display_tax_amount: MoneyAmountSchema,
    display_tax_amount_money_object: MoneyObjectSchema,
    tax_breakdown: z.array(z.object({
      name: z.string(),
      rate: z.number(),
      base_amount: MoneyAmountSchema,
      base_amount_money_object: MoneyObjectSchema,
      display_amount: MoneyAmountSchema,
      display_amount_money_object: MoneyObjectSchema
    })),
    base_discount_amount: MoneyAmountSchema,
    base_discount_amount_money_object: MoneyObjectSchema,
    display_discount_amount: MoneyAmountSchema,
    display_discount_amount_money_object: MoneyObjectSchema,
    base_total: MoneyAmountSchema,
    base_total_money_object: MoneyObjectSchema,
    display_total: MoneyAmountSchema,
    display_total_money_object: MoneyObjectSchema
  })),
  available_shipping_methods: z.array(z.object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    type: ShippingTypeSchema,
    base_cost: MoneyAmountSchema,
    base_cost_money_object: MoneyObjectSchema,
    display_cost: MoneyAmountSchema,
    display_cost_money_object: MoneyObjectSchema
  })),
  shipping_method: z.union([z.number(), z.string()]).nullish()
});

export type OrderCalculation = z.infer<typeof OrderCalculationSchema>;