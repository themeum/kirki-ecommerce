import type { OrderFormInput, OrderItem } from '@/types';

export const toOrderFormAddresses = (order: OrderItem): Partial<OrderFormInput> => {
  const shipping = order.shipping_address;
  const billing = order.billing_address;

  return {
    shipping_first_name: shipping.first_name ?? '',
    shipping_last_name: shipping.last_name ?? '',
    shipping_address_line1: shipping.line1 ?? '',
    shipping_address_line2: shipping.line2 ?? '',
    shipping_city: shipping.city ?? '',
    shipping_state: shipping.state ?? '',
    shipping_postal_code: shipping.postal_code ?? '',
    shipping_country: shipping.country ?? '',
    shipping_phone: shipping.phone ?? '',
    shipping_email: shipping.email ?? '',

    is_billing_same_as_shipping: order.is_billing_same_as_shipping,
    billing_first_name: billing.first_name ?? '',
    billing_last_name: billing.last_name ?? '',
    billing_address_line1: billing.line1 ?? '',
    billing_address_line2: billing.line2 ?? '',
    billing_city: billing.city ?? '',
    billing_state: billing.state ?? '',
    billing_postal_code: billing.postal_code ?? '',
    billing_country: billing.country ?? '',
    billing_phone: billing.phone ?? '',
    billing_email: billing.email ?? '',
  };
};
