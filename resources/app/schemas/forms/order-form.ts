import { isEmptyValue, nullishShape, prepareFormSchema, required, requiredWhen } from "@/libs/zod";
import { __ } from "@/wpi18n";
import z from "zod";

const OrderFormShape = prepareFormSchema(z.object({
  items: z.array(
    z.object({
      variant_id: z.number(),
      quantity: z.number(),
    })
  ),
  currency_code: z.string().nullish(),
  coupon_code: z.string().nullish(),
  customer_id: required(z.number(), __('Customer is required', 'kirki-ecommerce')),

  shipping_method: required(z.string(), __('Shipping method is required', 'kirki-ecommerce')),

  shipping_first_name: required(z.string(), __('First name is required', 'kirki-ecommerce')),
  shipping_last_name: required(z.string(), __('Last name is required', 'kirki-ecommerce')),
  shipping_address_line1: required(z.string(), __('Address is required', 'kirki-ecommerce')),
  shipping_address_line2: z.string().nullish(),
  shipping_city: required(z.string(), __('City is required', 'kirki-ecommerce')),
  shipping_state: required(z.string(), __('State is required', 'kirki-ecommerce')),
  shipping_postal_code: required(z.string(), __('Postal code is required', 'kirki-ecommerce')),
  shipping_country: required(z.string(), __('Country is required', 'kirki-ecommerce')),
  shipping_phone: z.string().nullish(),
  shipping_email: z.string().nullish(),
  shipping_company: z.string().nullish(),

  is_billing_same_as_shipping: z.boolean().default(false),
  billing_first_name: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_first_name), __('First name is required', 'kirki-ecommerce')),
  billing_last_name: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_last_name), __('Last name is required', 'kirki-ecommerce')),
  billing_address_line1: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_address_line1), __('Address is required', 'kirki-ecommerce')),
  billing_address_line2: z.string().nullish(),
  billing_city: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_city), __('City is required', 'kirki-ecommerce')),
  billing_state: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_state), __('State is required', 'kirki-ecommerce')),
  billing_postal_code: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_postal_code), __('Postal code is required', 'kirki-ecommerce')),
  billing_country: requiredWhen(z.string().nullish(), (values) => !values.is_billing_same_as_shipping && isEmptyValue(values.billing_country), __('Country is required', 'kirki-ecommerce')),
  billing_phone: z.string().nullish(),
  billing_email: z.string().nullish(),
  billing_company: z.string().nullish(),

  admin_notes: z.string().nullish(),
  flags: z.array(z.string()).nullish(),
  is_manual: z.boolean().default(true),
}));


const buildBillingFields = (values: z.output<typeof OrderFormShape>) => {
  if (values.is_billing_same_as_shipping) {
    return {
      billing_first_name: null,
      billing_last_name: null,
      billing_address_line1: null,
      billing_address_line2: null,
      billing_city: null,
      billing_state: null,
      billing_postcode: null,
      billing_country: null,
      billing_phone: null,
      billing_email: null,
      billing_company: null,
    };
  }

  return {
    billing_first_name: values.billing_first_name ?? null,
    billing_last_name: values.billing_last_name ?? null,
    billing_address_line1: values.billing_address_line1 ?? null,
    billing_address_line2: values.billing_address_line2 ?? null,
    billing_city: values.billing_city ?? null,
    billing_state: values.billing_state ?? null,
    billing_postcode: values.billing_postal_code ?? null,
    billing_country: values.billing_country ?? null,
    billing_phone: values.billing_phone ?? null,
    billing_email: values.billing_email ?? null,
    billing_company: values.billing_company ?? null,
  };
};

const OrderFormSchema = OrderFormShape.transform((values) => ({
  customer_id: values.customer_id,
  items: values.items,

  currency_code: values.currency_code ?? null,
  coupon_code: values.coupon_code?.trim() || null,

  shipping_method: values.shipping_method,
  shipping_first_name: values.shipping_first_name,
  shipping_last_name: values.shipping_last_name,
  shipping_address_line1: values.shipping_address_line1,
  shipping_address_line2: values.shipping_address_line2 ?? null,
  shipping_city: values.shipping_city,
  shipping_state: values.shipping_state,
  shipping_postcode: values.shipping_postal_code,
  shipping_country: values.shipping_country,
  shipping_phone: values.shipping_phone ?? null,
  shipping_email: values.shipping_email ?? null,
  shipping_company: values.shipping_company ?? null,

  is_billing_same_as_shipping: values.is_billing_same_as_shipping,
  ...buildBillingFields(values),

  admin_notes: values.admin_notes ?? null,
  flags: values.flags ?? null,
  is_manual: values.is_manual,
}));

const OrderCalculationRequestSchema = z.object(nullishShape(OrderFormShape)).transform((values) => ({
  customer_id: values.customer_id ?? null,
  items: values.items ?? [],

  currency_code: values.currency_code ?? null,
  coupon_code: values.coupon_code?.trim() || null,

  shipping_method: values.shipping_method ?? null,
  shipping_first_name: values.shipping_first_name ?? null,
  shipping_last_name: values.shipping_last_name ?? null,
  shipping_address_line1: values.shipping_address_line1 ?? null,
  shipping_address_line2: values.shipping_address_line2 ?? null,
  shipping_city: values.shipping_city ?? null,
  shipping_state: values.shipping_state ?? null,
  shipping_postcode: values.shipping_postal_code ?? null,
  shipping_country: values.shipping_country ?? null,
  shipping_phone: values.shipping_phone ?? null,
  shipping_email: values.shipping_email ?? null,
}));

type OrderFormInput = z.input<typeof OrderFormSchema>;
type OrderFormPayload = z.output<typeof OrderFormSchema>;
type OrderCalculationRequestPayload = z.output<typeof OrderCalculationRequestSchema>;

export { OrderCalculationRequestSchema, OrderFormSchema };
export type { OrderCalculationRequestPayload, OrderFormInput, OrderFormPayload };

