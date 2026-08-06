import { z } from 'zod';

import { PaymentGatewaySchema } from '@/schemas/catalog/payment';
import { ShippingZoneSchema } from '@/schemas/catalog/shipping';
import { TaxRegionSchema } from '@/schemas/catalog/tax';
import { MediaRefSchema } from '@/schemas/shared/media';

/**
 * `state`/`postal_code` are what `settings/general.yml` documents; the form
 * (`general-settings-form.ts`) reads/writes `state`/`postal_code`.
 * Both pairs are accepted since a merchant record saved through either name
 * must still round-trip.
 */
export const StoreAddressSchema = z
  .object({
    address_line_1: z.string().nullish(),
    address_line_2: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    postal_code: z.string().nullish(),
    country: z.string().nullish(),
  })
  .passthrough();

export const GeneralSettingsSchema = z
  .object({
    store_name: z.string().nullish(),
    store_email: z.string().nullish(),
    store_logo: MediaRefSchema.nullish(),
    store_phone: z.string().nullish(),
    store_address: StoreAddressSchema.nullish(),
    selling_location_type: z.string().nullish(),
    selling_countries: z.array(z.string()).nullish(),
    order_id_prefix: z.string().nullish(),
    order_id_suffix: z.string().nullish(),
    invoice_id_prefix: z.string().nullish(),
    invoice_id_sequence: z.string().nullish(),
    invoice_id_suffix: z.string().nullish(),
    invoice_counter_reset_schedule: z.string().nullish(),
  })
  .passthrough();

export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;

export const BarcodeGenerationSchema = z
  .object({
    data_origin: z.string().nullish(),
    format: z.string().nullish(),
    country_of_origin: z.string().nullish(),
    width: z.number().nullish(),
    height: z.number().nullish(),
    is_human_readable_text_visible: z.boolean().nullish(),
    is_product_name_visible: z.boolean().nullish(),
    is_country_of_origin_visible: z.boolean().nullish(),
  })
  .passthrough();

export const ProductSettingsSchema = z
  .object({
    shop_page: z.union([z.string(), z.number()]).nullish(),
    weight_unit: z.string().nullish(),
    dimension_unit: z.string().nullish(),
    display_layout: z.string().nullish(),
    is_enabled_reviews: z.boolean().nullish(),
    is_enabled_star_ratings: z.boolean().nullish(),
    is_unit_price_visible: z.boolean().nullish(),
    barcode_generation: BarcodeGenerationSchema.nullish(),
  })
  .passthrough();

export type ProductSettings = z.infer<typeof ProductSettingsSchema>;

export const CheckoutConfigurationSchema = z
  .object({
    address_line_validation: z.string().nullish(),
    phone_number_validation: z.string().nullish(),
    company_name_validation: z.string().nullish(),
    company_id_validation: z.string().nullish(),
    vat_identification_number_validation: z.string().nullish(),
    has_apply_coupon_code: z.boolean().nullish(),
  })
  .passthrough();

export const CheckoutSettingsSchema = z
  .object({
    is_allowed_guest_checkout: z.boolean().nullish(),
    checkout_configuration: CheckoutConfigurationSchema.nullish(),
    is_terms_and_conditions_visible: z.boolean().nullish(),
    terms_and_conditions_content: z.string().nullish(),
    is_privacy_policy_visible: z.boolean().nullish(),
    privacy_policy_content: z.string().nullish(),
  })
  .passthrough();

export type CheckoutSettings = z.infer<typeof CheckoutSettingsSchema>;

/**
 * A notification entry's fields vary per notification type beyond
 * `name`/`is_enabled` (subject/heading/message/shortcodes/...) — kept a
 * passthrough record rather than enumerated, matching the form side
 * (`email-settings-form.ts`, `zod-first-type-declarations` design.md
 * Decision on notification records).
 */
export const EmailNotificationSchema = z
  .object({
    name: z.string().nullish(),
    is_enabled: z.boolean().nullish(),
  })
  .passthrough();

export const EmailNotificationGroupSchema = z.record(EmailNotificationSchema);

export const EmailSettingsSchema = z
  .object({
    default_template: z.record(z.unknown()).nullish(),
    customer_emails: z
      .object({
        order_notifications: EmailNotificationGroupSchema.nullish(),
        user_notifications: EmailNotificationGroupSchema.nullish(),
        inventory_notifications: EmailNotificationGroupSchema.nullish(),
      })
      .passthrough()
      .nullish(),
    admin_emails: z
      .object({
        order_notifications: EmailNotificationGroupSchema.nullish(),
        user_notifications: EmailNotificationGroupSchema.nullish(),
        inventory_notifications: EmailNotificationGroupSchema.nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

export type EmailSettings = z.infer<typeof EmailSettingsSchema>;

export const ShippingSettingsSchema = z
  .object({
    shipping_zones: z.array(ShippingZoneSchema).nullish(),
  })
  .passthrough();

export type ShippingSettings = z.infer<typeof ShippingSettingsSchema>;

export const TaxSettingsSchema = z
  .object({
    is_tax_inclusive_price: z.boolean().nullish(),
    is_shipping_tax_enabled: z.boolean().nullish(),
    is_enabled_taxed_price: z.boolean().nullish(),
    tax_regions: z.array(TaxRegionSchema).nullish(),
    tax_services: z.array(z.unknown()).nullish(),
    tax_ids: z.array(z.unknown()).nullish(),
  })
  .passthrough();

export type TaxSettings = z.infer<typeof TaxSettingsSchema>;

export const CurrencyApiConfigSchema = z
  .object({
    api_key: z.string().nullish(),
    update_frequency: z.string().nullish(),
    fallback_behaviour: z.string().nullish(),
    is_cache_enabled: z.boolean().nullish(),
  })
  .passthrough();

export const CurrencyUsageSchema = z
  .object({
    total: z.number().nullish(),
    used: z.number().nullish(),
    remaining: z.number().nullish(),
    reset_at: z.string().nullish(),
  })
  .passthrough();

export const CurrencySettingsSchema = z
  .object({
    currency_format: z.string().nullish(),
    currency_position: z.string().nullish(),
    thousand_separator: z.string().nullish(),
    decimal_separator: z.string().nullish(),
    is_automatic_update_enabled: z.boolean().nullish(),
    api_provider: z.string().nullish(),
    api_config: z.union([CurrencyApiConfigSchema, z.array(z.unknown())]).nullish(),
    last_sync_at: z.string().nullish(),
    next_sync_at: z.string().nullish(),
    usage: CurrencyUsageSchema.nullish(),
  })
  .passthrough();

export type CurrencySettings = z.infer<typeof CurrencySettingsSchema>;

export const PaymentSettingsSchema = z
  .object({
    payment_gateways: z.array(PaymentGatewaySchema).nullish(),
  })
  .passthrough();

export type PaymentSettings = z.infer<typeof PaymentSettingsSchema>;

/**
 * `orders` and `default` are deliberately absent: neither has a documented
 * endpoint or a frontend caller (`docs/ecommerce/settings/` has no
 * `orders.yml`/`default.yml`, and no call site ever requests either key —
 * see proposal.md - What Changes).
 */
export const SettingsSchemaMap = {
  general: GeneralSettingsSchema,
  product: ProductSettingsSchema,
  checkout: CheckoutSettingsSchema,
  email: EmailSettingsSchema,
  shipping: ShippingSettingsSchema,
  tax: TaxSettingsSchema,
  currency: CurrencySettingsSchema,
  payment: PaymentSettingsSchema,
} as const;

export type SettingsSectionKey = keyof typeof SettingsSchemaMap;
