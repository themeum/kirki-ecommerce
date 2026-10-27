import z from 'zod';

import { stateRequiredMessage } from '@/features/orders/schemas/forms/order-form';
import { isAddressFieldRequired } from '@/libs/address-rules';
import { isEmptyValue, required, requiredWhen, stringOrNull } from '@/libs/zod';
import { __ } from '@/wpi18n';

const OrderAddressFormSchema = z.object({
  first_name: required(z.string(), __('First name is required', 'kirki-ecommerce')),
  last_name: required(z.string(), __('Last name is required', 'kirki-ecommerce')),
  address_line1: required(z.string(), __('Address is required', 'kirki-ecommerce')),
  address_line2: stringOrNull(),
  city: required(z.string(), __('City is required', 'kirki-ecommerce')),
  state: requiredWhen(
    z.string().nullish(),
    (values) =>
      isAddressFieldRequired((values.country ?? '') as string, 'state') &&
      isEmptyValue(values.state),
    (values) => stateRequiredMessage(values.country),
  ),
  postal_code: requiredWhen(
    z.string().nullish(),
    (values) =>
      isAddressFieldRequired((values.country ?? '') as string, 'postal_code') &&
      isEmptyValue(values.postal_code),
    __('Postal code is required', 'kirki-ecommerce'),
  ),
  country: required(z.string(), __('Country is required', 'kirki-ecommerce')),
  phone: stringOrNull(),
  email: stringOrNull(),
  company: stringOrNull(),
}).transform((values) => ({
  first_name: values.first_name,
  last_name: values.last_name,
  address_line1: values.address_line1,
  address_line2: values.address_line2 || null,
  city: values.city,
  state: values.state || null,
  postal_code: values.postal_code || null,
  country: values.country,
  phone: values.phone || null,
  email: values.email || null,
  company: values.company || null,
}));

type OrderAddressFormInput = z.input<typeof OrderAddressFormSchema>;
type OrderAddressFormPayload = z.output<typeof OrderAddressFormSchema>;

export { type OrderAddressFormInput, type OrderAddressFormPayload,OrderAddressFormSchema };
