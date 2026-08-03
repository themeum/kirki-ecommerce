import { required } from "@/libs/zod";
import { OrderStatusSchema, PaymentStatusSchema } from "@/schemas/catalog/order";
import { __ } from "@/wpi18n";
import z from "zod";

const OrderFormSchema = z.object({
  items: z.array(
    z.object({
      variant_id: z.number(),
      quantity: z.number(),
    })
  ),
  currency_code: z.string().nullish(),
  coupon_code: z.string().nullish(),

  customer_id: required(z.number(), __('Customer is required', 'kirki-ecommerce')),
  customer_notes: z.string().nullish(),
  is_manual: z.boolean().default(true),
  order_status: OrderStatusSchema.default('pending'),
  payment_status: PaymentStatusSchema.default('pending'),

  shipping_method: required(z.string(), __('Shipping method is required', 'kirki-ecommerce')),
  shipping_first_name: z.string().default(''),
  shipping_last_name: z.string().default(''),
  shipping_address_line1: z.string().default(''),
  shipping_address_line2: z.string().nullish(),
  shipping_city: z.string().default(''),
  shipping_state: z.string().default(''),
  shipping_postal_code: z.string().default(''),
  shipping_country: z.string().default(''),
  shipping_phone: z.string().nullish(),
  shipping_email: z.string().nullish(),
  shipping_company: z.string().nullish(),

  is_billing_same_as_shipping: z.boolean().default(false),
  billing_first_name: z.string().default(''),
  billing_last_name: z.string().default(''),
  billing_address_line1: z.string().default(''),
  billing_address_line2: z.string().nullish(),
  billing_city: z.string().default(''),
  billing_state: z.string().default(''),
  billing_postal_code: z.string().default(''),
  billing_country: z.string().default(''),
  billing_phone: z.string().nullish(),
  billing_email: z.string().nullish(),
  billing_company: z.string().nullish(),
})

type OrderFormInput = z.input<typeof OrderFormSchema>;
type OrderFormPayload = z.output<typeof OrderFormSchema>;

export { OrderFormSchema };
export type { OrderFormInput, OrderFormPayload };

