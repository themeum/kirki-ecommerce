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

export const OrderAddressSchema = z.object({
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  line1: z.string().nullish(),
  line2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  postal_code: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
});

export type OrderAddress = z.infer<typeof OrderAddressSchema>;

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
  amount: MoneyAmountSchema,
  amount_object: MoneyObjectSchema,
  refund_type: RefundTypeSchema,
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
    subtotal: MoneyAmountSchema,
    subtotal_object: MoneyObjectSchema,
    shipping: MoneyAmountSchema,
    shipping_object: MoneyObjectSchema,
    discount: MoneyAmountSchema,
    discount_object: MoneyObjectSchema,
    tax: MoneyAmountSchema,
    tax_object: MoneyObjectSchema,
    total: MoneyAmountSchema,
    total_object: MoneyObjectSchema,
  }),
  items_count: z.number(),
  items: z.array(z.object({
    id: z.number(),
    product_id: z.number(),
    variant_id: z.number(),
    product_name: z.string(),
    variant_name: z.string(),
    quantity: z.number(),
    price: MoneyAmountSchema,
    price_object: MoneyObjectSchema,
    subtotal: MoneyAmountSchema,
    subtotal_object: MoneyObjectSchema,
    discount_amount: MoneyAmountSchema,
    discount_amount_object: MoneyObjectSchema,
    total: MoneyAmountSchema,
    total_object: MoneyObjectSchema,
    tax_rate: MoneyAmountSchema,
    tax_total: MoneyAmountSchema,
    tax_total_object: MoneyObjectSchema,
    tax_breakdown: z.array(z.object({
      name: z.string(),
      rate: z.number(),
      total: MoneyAmountSchema
    })).nullish(),
    sku: z.string(),
    image: MediaRefSchema.nullish(),
  })),
  shipping_address: OrderAddressSchema,
  is_billing_same_as_shipping: z.boolean(),
  billing_address: OrderAddressSchema,
  payment_method: z.string().nullish(),
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
  total: MoneyAmountSchema,
  total_object: MoneyObjectSchema,
  status: OrderStatusSchema,
  payment_status: PaymentStatusSchema,
  payment_method: z.string().nullish(),
  created_at: z.string()
}));

export type OrderListItem = z.infer<typeof OrderListItemSchema>;

export const OrderCalculationSchema = z.object({
  pricing: z.object({
    subtotal: MoneyAmountSchema,
    subtotal_object: MoneyObjectSchema,
    tax_total: MoneyAmountSchema,
    tax_total_object: MoneyObjectSchema,
    discount_total: MoneyAmountSchema,
    discount_total_object: MoneyObjectSchema,
    shipping_subtotal: MoneyAmountSchema,
    shipping_subtotal_object: MoneyObjectSchema,
    shipping_tax: MoneyAmountSchema,
    shipping_tax_object: MoneyObjectSchema,
    shipping_discount: MoneyAmountSchema,
    shipping_discount_object: MoneyObjectSchema,
    shipping_total: MoneyAmountSchema,
    shipping_total_object: MoneyObjectSchema,
    total: MoneyAmountSchema,
    total_object: MoneyObjectSchema
  }),
  items_count: z.number(),
  items: z.array(z.object({
    id: z.number(),
    quantity: z.number(),
    subtotal: MoneyAmountSchema,
    subtotal_object: MoneyObjectSchema,
    tax_rate: MoneyAmountSchema,
    tax_amount: MoneyAmountSchema,
    tax_amount_object: MoneyObjectSchema,
    discount_amount: MoneyAmountSchema,
    discount_amount_object: MoneyObjectSchema,
    total: MoneyAmountSchema,
    total_object: MoneyObjectSchema
  })),
  available_shipping_methods: z.array(z.object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    type: ShippingTypeSchema,
    cost: MoneyAmountSchema,
    cost_object: MoneyObjectSchema
  }))
});

export type OrderCalculation = z.infer<typeof OrderCalculationSchema>;