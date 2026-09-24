import { z } from 'zod';

import { isAddressFieldRequired } from '@/libs/address-rules';
import { mediaId, prepareFormSchema, required } from '@/libs/zod';
import { __ } from '@/wpi18n';

const AddressFormShape = z.object({
  id: z.number().optional(),
  customer_id: z.number().optional(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  country: required(z.string().default(''), __('Country is required', 'kirki-ecommerce')),
  address_line1: z.string().nullish().default(''),
  address_line2: z.string().nullish().default(''),
  city: z.string().nullish().default(''),
  state: z.string().nullish().default(''),
  postal_code: z.string().nullish().default(''),
  is_default_shipping: z.boolean().default(false),
  is_default_billing: z.boolean().default(false),
  type: z.enum(['home', 'office', 'others']).nullish().default('home'),
  label: z.string().nullish().default(''),
});

type AddressFormValues = z.infer<typeof AddressFormShape>;

const ADDRESS_CONTENT_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
] as const;

const isAddressRowTouched = (address: AddressFormValues) =>
  ADDRESS_CONTENT_FIELDS.some((field) => !!address[field]);

const CustomerFormShape = z.object({
  first_name: required(z.string().default(''), __('First name is required', 'kirki-ecommerce')),
  last_name: z.string().nullish().default(''),
  email: required(z.string().default(''), __('Email is required', 'kirki-ecommerce')).pipe(
    z.string().email(__('Please enter a valid email', 'kirki-ecommerce')),
  ),
  phone: z.string().nullish().default(''),
  language: z.string().nullish().default('english'),
  accepts_marketing: z.boolean().default(false),
  create_wordpress_user: z.boolean().default(false),
  addresses: z.array(AddressFormShape).default([]),
  photo: mediaId(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullish(),
});

const CustomerFormSchema = prepareFormSchema(CustomerFormShape)
  .superRefine((values, ctx) => {
    values.addresses.forEach((address, index) => {
      if (!isAddressRowTouched(address)) {
        return;
      }

      if (!address.first_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addresses', index, 'address_line1'],
          message: __('This field is required', 'kirki-ecommerce'),
        });
      }

      if (!address.address_line1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addresses', index, 'address_line1'],
          message: __('This field is required', 'kirki-ecommerce'),
        });
      }

      (['state', 'postal_code'] as const).forEach((field) => {
        if (isAddressFieldRequired(address.country, field) && !address[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['addresses', index, field],
            message: __('This field is required', 'kirki-ecommerce'),
          });
        }
      });

      if (address.type === 'others' && !address.label) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addresses', index, 'label'],
          message: __('This field is required', 'kirki-ecommerce'),
        });
      }
    });
  })
  .transform((values) => {
    return {
      first_name: values.first_name,
      last_name: values.last_name || null,
      email: values.email,
      phone: values.phone || null,
      language: values.language || null,
      create_wordpress_user: values.create_wordpress_user,
      accepts_marketing: values.accepts_marketing,
      photo: values.photo,
      tags: values.tags,
      addresses: (values.addresses || []).filter(isAddressRowTouched),
      notes: values.notes || null,
    };
  });

type CustomerFormInput = z.input<typeof CustomerFormSchema>;

type CustomerFormPayload = z.output<typeof CustomerFormSchema>;

export {
  type AddressFormValues,
  type CustomerFormInput,
  type CustomerFormPayload,
  CustomerFormSchema,
};
