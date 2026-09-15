import { z } from 'zod';

import { prepareFormSchema } from '@/libs/zod';

export const CheckoutConfigurationSchema = z.object({
  address_line_validation: z.string().nullish().default(''),
  phone_number_validation: z.string().nullish().default(''),
  company_name_validation: z.string().nullish().default(''),
  company_id_validation: z.string().nullish().default(''),
  vat_identification_number_validation: z.string().nullish().default(''),
  has_apply_coupon_code: z.boolean().default(true),
});

const CheckoutSettingsFormShape = z.object({
  is_allowed_guest_checkout: z.boolean().default(false),
  checkout_configuration: CheckoutConfigurationSchema.default({}),
});

export const CheckoutSettingsFormSchema = prepareFormSchema(CheckoutSettingsFormShape).transform((values) => ({
  is_allowed_guest_checkout: values.is_allowed_guest_checkout,
  checkout_configuration: {
    address_line_validation: values.checkout_configuration.address_line_validation || null,
    phone_number_validation: values.checkout_configuration.phone_number_validation || null,
    company_name_validation: values.checkout_configuration.company_name_validation || null,
    company_id_validation: values.checkout_configuration.company_id_validation || null,
    vat_identification_number_validation:
      values.checkout_configuration.vat_identification_number_validation || null,
    has_apply_coupon_code: values.checkout_configuration.has_apply_coupon_code,
  },
}));

export type CheckoutSettingsFormInput = z.input<typeof CheckoutSettingsFormSchema>;

export type CheckoutSettingsFormPayload = z.output<typeof CheckoutSettingsFormSchema>;
