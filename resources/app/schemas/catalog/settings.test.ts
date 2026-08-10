import { describe, expect, it } from 'vitest';

import {
  CheckoutSettingsSchema,
  CurrencySettingsSchema,
  EmailSettingsSchema,
  GeneralSettingsSchema,
  PaymentSettingsSchema,
  ProductSettingsSchema,
  SettingsSchemaMap,
  ShippingSettingsSchema,
  TaxSettingsSchema,
} from '@/schemas/catalog/settings';

describe('GeneralSettingsSchema', () => {
  it('accepts the documented response (settings/general.yml)', () => {
    const result = GeneralSettingsSchema.safeParse({
      store_name: 'Droip Ecommerce',
      store_email: 'info@droip.com',
      store_logo: {
        id: '7',
        filename: 'project-launch-bg.webp',
        url: 'http://droip.local/wp-content/uploads/2025/10/project-launch-bg.webp',
      },
      store_phone: null,
      store_address: {
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        postal_code: null,
        country: null,
      },
      selling_location_type: 'all-countries',
      selling_countries: [],
      order_id_prefix: null,
      order_id_suffix: null,
      invoice_id_prefix: null,
      invoice_id_suffix: null,
      invoice_counter_reset_schedule: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts store_address using the form field names instead (state/postal_code)', () => {
    const result = GeneralSettingsSchema.safeParse({
      store_address: { state: 'CA', postal_code: '94105' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized extra field', () => {
    const result = GeneralSettingsSchema.safeParse({ store_name: 'Shop', unexpected: 'value' });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = GeneralSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('ProductSettingsSchema', () => {
  it('accepts the documented response (settings/product.yml)', () => {
    const result = ProductSettingsSchema.safeParse({
      shop_page: null,
      weight_unit: 'kg',
      dimension_unit: 'm',
      display_layout: null,
      is_enabled_reviews: true,
      is_enabled_star_ratings: true,
      is_unit_price_visible: true,
      barcode_generation: {
        data_origin: 'SKU',
        format: 'Code 128 (recommended for SKU/internal use)',
        width: 2.5,
        height: 1.5,
        country_of_origin: 'Bangladesh',
        is_human_readable_text_visible: false,
        is_product_name_visible: false,
        is_country_of_origin_visible: false,
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = ProductSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CheckoutSettingsSchema', () => {
  it('accepts the documented response (settings/checkout.yml)', () => {
    const result = CheckoutSettingsSchema.safeParse({
      is_allowed_guest_checkout: true,
      checkout_configuration: {
        address_line_validation: 'required',
        phone_number_validation: 'required',
        company_name_validation: 'optional',
        company_id_validation: 'optional',
        vat_identification_number_validation: 'optional',
        has_apply_coupon_code: true,
      },
      is_terms_and_conditions_visible: true,
      terms_and_conditions_content: 'Terms',
      is_privacy_policy_visible: true,
      privacy_policy_content: 'Privacy',
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = CheckoutSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('EmailSettingsSchema', () => {
  it('accepts the documented response shape (settings/email.yml)', () => {
    const result = EmailSettingsSchema.safeParse({
      default_template: {
        logo: null,
        height: '30px',
        position: 'center',
        colors: { background: '#000000', text: '#ffffff' },
      },
      customer_emails: {
        order_notifications: {
          new_order_email: {
            is_enabled: true,
            name: 'New Order',
            subject: 'New Order',
            heading: 'New Order',
            message: '<p>Hi there!</p>',
            shortcodes: [{ label: 'Order Table', value: '{order_table}' }],
          },
        },
      },
      admin_emails: {},
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unrecognized notification group and extra notification fields', () => {
    const result = EmailSettingsSchema.safeParse({
      customer_emails: {
        unexpected_group: {
          some_email: { name: 'x', is_enabled: true, extra_field: 'value' },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = EmailSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('ShippingSettingsSchema', () => {
  it('accepts an empty shipping_zones array', () => {
    const result = ShippingSettingsSchema.safeParse({ shipping_zones: [] });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = ShippingSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('TaxSettingsSchema', () => {
  it('accepts the documented response (settings/tax.yml)', () => {
    const result = TaxSettingsSchema.safeParse({
      is_tax_inclusive_price: true,
      is_shipping_tax_enabled: true,
      is_enabled_taxed_price: false,
      tax_regions: [{ code: 'EU', name: 'European Union', type: 'oss' }],
      tax_services: [],
      tax_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = TaxSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('CurrencySettingsSchema', () => {
  it('accepts the documented response, including fields SettingsSectionData omitted (settings/currency.yml)', () => {
    const result = CurrencySettingsSchema.safeParse({
      currency_format: 'short',
      currency_position: 'before',
      thousand_separator: ',',
      decimal_separator: '.',
      is_automatic_update_enabled: true,
      api_provider: 'currency_api',
      api_config: {
        api_key: 'cur_live_x',
        update_frequency: 'hourly',
        fallback_behaviour: null,
        is_cache_enabled: true,
      },
      last_sync_at: '2026-02-26 11:28:22',
      next_sync_at: '2026-02-26 12:28:23',
      usage: { total: 300, used: 15, remaining: 285, reset_at: '2026-03-01T00:00:00.000000Z' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts api_config as an empty array — PHP empty-associative-array-as-JSON quirk, confirmed live (GET /settings/currency)', () => {
    const result = CurrencySettingsSchema.safeParse({
      currency_format: 'short',
      is_automatic_update_enabled: true,
      api_config: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = CurrencySettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('PaymentSettingsSchema', () => {
  it('accepts the documented response, including offline payments with no id (settings/payment.yml)', () => {
    const result = PaymentSettingsSchema.safeParse({
      offline_payments: [
        { is_enabled: true, is_offline: true, name: 'Cash on Delivery', icon: 'cash', instructions: 'Cash on Delivery' },
        { is_enabled: true, is_offline: true, name: 'Cash on Delivery', icon: 'cash', instructions: 'Cash on Delivery', config: [] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts every field absent', () => {
    const result = PaymentSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('SettingsSchemaMap', () => {
  it('has exactly the eight sections with a real endpoint and caller', () => {
    expect(Object.keys(SettingsSchemaMap).sort()).toEqual(
      ['checkout', 'currency', 'email', 'general', 'payment', 'product', 'shipping', 'tax'].sort(),
    );
  });
});
