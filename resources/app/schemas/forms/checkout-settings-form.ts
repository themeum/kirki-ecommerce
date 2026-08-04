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
  is_terms_and_conditions_visible: z.boolean().default(false),
  terms_and_conditions_content: z.string().nullish().default(''),
  is_privacy_policy_visible: z.boolean().default(false),
  privacy_policy_content: z.string().nullish().default(''),
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
  is_terms_and_conditions_visible: values.is_terms_and_conditions_visible,
  terms_and_conditions_content: values.terms_and_conditions_content || null,
  is_privacy_policy_visible: values.is_privacy_policy_visible,
  privacy_policy_content: values.privacy_policy_content || null,
}));

export type CheckoutSettingsFormInput = z.input<typeof CheckoutSettingsFormSchema>;

export type CheckoutSettingsFormPayload = z.output<typeof CheckoutSettingsFormSchema>;
