import { CustomerAddressSchema } from "@/schemas/catalog/customer";
import { mediaRef } from "@/schemas/forms/shared/validators";
import { MoneyAmountSchema } from "@/schemas/shared/api";
import z from "zod";

export const OrderStatusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded', 'partially-refunded', 'on-hold']);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentStatusSchema = z.enum(['pending', 'processing', 'on-hold', 'paid', 'failed', 'refunded', 'partially-refunded']);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const RefundStatusSchema = z.enum(['pending', 'completed', 'cancelled']);

export type RefundStatus = z.infer<typeof RefundStatusSchema>;

export const RefundTypeSchema = z.enum(['full', 'partial']);

export type RefundType = z.infer<typeof RefundTypeSchema>;

export const RefundSchema = z.object({
  id: z.number(),
  amount: MoneyAmountSchema,
  refund_type: RefundTypeSchema,
  reason: z.string().nullish(),
  transaction_id: z.string().nullish(),
  status: RefundStatusSchema,
  created_at: z.string().nullish(),
  created_by: z.number().nullish(),
});

export type Refund = z.infer<typeof RefundSchema>;

export const OrderItemSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  order_number: z.string(),
  customer_id: z.number(),
  status: OrderStatusSchema,
  currency_code: z.string(),
  totals: z.object({
    total: MoneyAmountSchema,
    subtotal: MoneyAmountSchema,
    shipping: MoneyAmountSchema,
    discount: MoneyAmountSchema,
    tax: MoneyAmountSchema,
  }),
  items_count: z.number(),
  items: z.array(z.object({
    id: z.number(),
    product_name: z.string(),
    variant_name: z.string(),
    quantity: z.number(),
    price: MoneyAmountSchema,
    total: MoneyAmountSchema,
    tax_rate: MoneyAmountSchema,
    tax_total: MoneyAmountSchema,
    tax_breakdown: z.array(z.object({
      name: z.string(),
      rate: z.number(),
      total: MoneyAmountSchema
    })),
    sku: z.string(),
    image: mediaRef.nullish(),
  })),
  shipping_address: CustomerAddressSchema.nullish(),
  billing_address: CustomerAddressSchema.nullish(),
  payment_method: z.string(),
  payment_status: PaymentStatusSchema,
  shipping_method: z.string().nullish(),
  customer_notes: z.string().nullish(),
  refunds: z.array(RefundSchema).nullish(),
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
  status: OrderStatusSchema,
  payment_status: PaymentStatusSchema,
  payment_method: z.string(),
  created_at: z.string()
}));

export type OrderListItem = z.infer<typeof OrderListItemSchema>;