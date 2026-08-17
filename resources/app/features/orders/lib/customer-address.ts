import type { Customer, CustomerAddress } from '@/features/customers';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import type { Country } from '@/schemas/reference/country';

export type AddressLines = {
  line1: string;
  line2: string;
};

type AddressFormValues = Partial<Omit<OrderFormInput, 'items'>>;

export const getCountryName = (
  countries: Country[],
  code?: string | null,
): string => {
  if (!code) {
    return '';
  }

  return countries.find((country) => country.code === code)?.name ?? code;
};

const buildAddressLines = (
  parts: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  },
  countries: Country[],
): AddressLines | null => {
  if (!parts.addressLine1) {
    return null;
  }

  return {
    line1: [parts.addressLine1, parts.addressLine2].filter(Boolean).join(', '),
    line2: [
      parts.city,
      parts.state,
      parts.postalCode,
      getCountryName(countries, parts.country),
    ]
      .filter(Boolean)
      .join(', '),
  };
};

export const formatShippingAddress = (
  values: AddressFormValues,
  countries: Country[],
): AddressLines | null =>
  buildAddressLines(
    {
      addressLine1: values.shipping_address_line1,
      addressLine2: values.shipping_address_line2,
      city: values.shipping_city,
      state: values.shipping_state,
      postalCode: values.shipping_postal_code,
      country: values.shipping_country,
    },
    countries,
  );

export const formatBillingAddress = (
  values: AddressFormValues,
  countries: Country[],
): AddressLines | null => {
  if (values.is_billing_same_as_shipping) {
    return formatShippingAddress(values, countries);
  }

  return buildAddressLines(
    {
      addressLine1: values.billing_address_line1,
      addressLine2: values.billing_address_line2,
      city: values.billing_city,
      state: values.billing_state,
      postalCode: values.billing_postal_code,
      country: values.billing_country,
    },
    countries,
  );
};

const addressName = (
  address: CustomerAddress | null | undefined,
  customer: Customer,
) => ({
  firstName: address?.first_name || customer.first_name || '',
  lastName: address?.last_name || customer.last_name || '',
  phone: address?.phone || customer.phone || '',
  email: address?.email || customer.email || '',
});

export const toOrderAddresses = (customer: Customer): Partial<OrderFormInput> => {
  const shipping = customer.shipping_address;
  const billing = customer.is_billing_same_as_shipping
    ? customer.shipping_address
    : customer.billing_address;
  const shippingContact = addressName(shipping, customer);
  const billingContact = addressName(billing, customer);

  return {
    shipping_first_name: shippingContact.firstName,
    shipping_last_name: shippingContact.lastName,
    shipping_address_line1: shipping?.address_line1 ?? '',
    shipping_address_line2: shipping?.address_line2 ?? '',
    shipping_city: shipping?.city ?? '',
    shipping_state: shipping?.state ?? '',
    shipping_postal_code: shipping?.postal_code ?? '',
    shipping_country: shipping?.country ?? '',
    shipping_phone: shippingContact.phone,
    shipping_email: shippingContact.email,

    is_billing_same_as_shipping: Boolean(customer.is_billing_same_as_shipping),
    billing_first_name: billingContact.firstName,
    billing_last_name: billingContact.lastName,
    billing_address_line1: billing?.address_line1 ?? '',
    billing_address_line2: billing?.address_line2 ?? '',
    billing_city: billing?.city ?? '',
    billing_state: billing?.state ?? '',
    billing_postal_code: billing?.postal_code ?? '',
    billing_country: billing?.country ?? '',
    billing_phone: billingContact.phone,
    billing_email: billingContact.email,
  };
};
