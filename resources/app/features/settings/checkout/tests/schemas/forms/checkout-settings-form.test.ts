import { describe, expect, it } from 'vitest';

import { CheckoutSettingsFormSchema } from '@/features/settings/checkout/schemas/forms/checkout-settings-form';

describe('CheckoutSettingsFormSchema', () => {
  const base = {
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

  it('produces the exact payload for a fully filled form', () => {
    const result = CheckoutSettingsFormSchema.parse({
      ...base,
      is_allowed_guest_checkout: true,
      checkout_configuration: { ...base.checkout_configuration, address_line_validation: 'required' },
    });
    expect(result.is_allowed_guest_checkout).toBe(true);
    expect(result.checkout_configuration.address_line_validation).toBe('required');
  });

  it('sends null for blank nested and top-level text fields', () => {
    const result = CheckoutSettingsFormSchema.parse(base);
    expect(result.checkout_configuration.address_line_validation).toBeNull();
    expect(result.terms_and_conditions_content).toBeNull();
    expect(result.privacy_policy_content).toBeNull();
  });
});
