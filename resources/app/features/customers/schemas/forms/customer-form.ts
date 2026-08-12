import { z } from 'zod';

import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { email as emailField } from '@/schemas/forms/shared/validators';
import { __ } from '@/wpi18n';

const AddressFormShape = z.object({
  id: z.number().optional(),
  customer_id: z.number().optional(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  country: z.string().nullish().default(''),
  address_line1: z.string().nullish().default(''),
  address_line2: z.string().nullish().default(''),
  city: z.string().nullish().default(''),
  state: z.string().nullish().default(''),
  postal_code: z.string().nullish().default(''),
  type: z.string().nullish(),
});

type AddressFormValues = z.infer<typeof AddressFormShape>;

/**
 * The billing/shipping address forms have no first_name/last_name/email/phone
 * fields of their own — those pass through whatever the record already had.
 * When the address is not "same as shipping", they're overwritten with the
 * customer's own identity instead (the only place a merchant can edit them).
 */
const buildAddressPayload = (
  address: AddressFormValues,
  identity: { first_name: string; last_name: string | null; email: string; phone: string | null } | null,
) => ({
  id: address.id,
  customer_id: address.customer_id,
  first_name: identity ? identity.first_name : address.first_name || null,
  last_name: identity ? identity.last_name : address.last_name || null,
  email: identity ? identity.email : address.email || null,
  phone: identity ? identity.phone : address.phone || null,
  country: address.country || null,
  address_line1: address.address_line1 || null,
  address_line2: address.address_line2 || null,
  city: address.city || null,
  state: address.state || null,
  postal_code: address.postal_code || null,
  type: address.type || null,
});

const CustomerFormShape = z.object({
  first_name: required(z.string().default(''), __('First name is required', 'kirki-ecommerce')),
  last_name: z.string().nullish().default(''),
  email: emailField(),
  phone: z.string().nullish().default(''),
  language: z.string().nullish().default('english'),
  accepts_marketing: z.boolean().default(false),
  photo: mediaId(),
  shipping_address: AddressFormShape.default({}),
  billing_address: AddressFormShape.default({}),
  is_billing_same_as_shipping: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const CustomerFormSchema = prepareFormSchema(CustomerFormShape).transform((values) => {
  const identity = {
    first_name: values.first_name,
    last_name: values.last_name || null,
    email: values.email,
    phone: values.phone || null,
  };

  return {
    first_name: values.first_name,
    last_name: values.last_name || null,
    email: values.email,
    phone: values.phone || null,
    language: values.language || null,
    accepts_marketing: values.accepts_marketing,
    photo: values.photo,
    shipping_address: buildAddressPayload(values.shipping_address, identity),
    billing_address: values.is_billing_same_as_shipping
      ? buildAddressPayload(values.billing_address, null)
      : buildAddressPayload(values.billing_address, identity),
    is_billing_same_as_shipping: values.is_billing_same_as_shipping,
    tags: values.tags,
  };
});

type CustomerFormInput = z.input<typeof CustomerFormSchema>;

type CustomerFormPayload = z.output<typeof CustomerFormSchema>;

export { type CustomerFormInput, type CustomerFormPayload, CustomerFormSchema };
