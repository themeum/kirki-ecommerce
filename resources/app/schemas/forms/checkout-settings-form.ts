import { z } from 'zod';

export const CheckoutConfigurationSchema = z
  .object({
    address_line_validation: z.string().optional(),
    phone_number_validation: z.string().optional(),
    company_name_validation: z.string().optional(),
    company_id_validation: z.string().optional(),
    vat_identification_number_validation: z.string().optional(),
    has_apply_coupon_code: z.boolean().optional(),
  })
  .passthrough();

export const CheckoutSettingsFormSchema = z
  .object({
    is_allowed_guest_checkout: z.boolean().optional(),
    checkout_configuration: CheckoutConfigurationSchema.optional(),
    is_terms_and_conditions_visible: z.boolean().optional(),
    terms_and_conditions_content: z.string().optional().nullable(),
    is_privacy_policy_visible: z.boolean().optional(),
    privacy_policy_content: z.string().optional().nullable(),
  })
  .passthrough();

export type CheckoutSettingsFormValues = z.infer<
  typeof CheckoutSettingsFormSchema
>;

export const checkoutSettingsDefaultValues: CheckoutSettingsFormValues = {
  is_allowed_guest_checkout: false,
  checkout_configuration: {
    address_line_validation: '',
    phone_number_validation: '',
    company_name_validation: '',
    company_id_validation: '',
    vat_identification_number_validation: '',
    has_apply_coupon_code: true,
  },
  is_terms_and_conditions_visible: false,
  terms_and_conditions_content: '',
  is_privacy_policy_visible: false,
  privacy_policy_content: '',
};
