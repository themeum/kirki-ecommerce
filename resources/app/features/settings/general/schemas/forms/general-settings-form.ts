import { z } from 'zod';

import { mediaId, prepareFormSchema } from '@/libs/zod';
import { __ } from '@/wpi18n';

const StoreAddressFormShape = z.object({
  address_line_1: z.string().nullish().default(''),
  address_line_2: z.string().nullish().default(''),
  city: z.string().nullish().default(''),
  state: z.string().nullish().default(''),
  postal_code: z.string().nullish().default(''),
  country: z.string().nullish().default(''),
});

const affix = () =>
  z
    .string()
    .default('')
    .refine((value) => !/[/\\]/.test(value), {
      message: __('Slashes and backslashes are not allowed.', 'kirki-ecommerce'),
    });

const GeneralSettingsFormShape = z.object({
  store_name: z.string().nullish().default(''),
  store_email: z.string().nullish().default(''),
  store_logo: mediaId(),
  store_phone: z.string().nullish().default(''),
  store_address: StoreAddressFormShape.nullish(),
  selling_location_type: z.string().nullish().default('all-countries'),
  selling_countries: z.array(z.string()).default([]),
  order_number: z
    .object({
      prefix: affix(),
      suffix: affix(),
    })
    .nullish(),
  invoice_number: z
    .object({
      prefix: affix(),
      sequence: z
        .string()
        .default('000001')
        .refine((value) => !value || /^\d+$/.test(value), {
          message: __('Sequence must contain digits only.', 'kirki-ecommerce'),
        }),
      suffix: affix(),
      apply_year_prefix: z.boolean().default(false),
      reset_sequence_every_year: z.boolean().default(false),
    })
    .nullish(),
  is_tax_calculation_enabled: z.boolean().default(true),
});

export const GeneralSettingsFormSchema = prepareFormSchema(GeneralSettingsFormShape).transform(
  (values) => ({
    store_name: values.store_name || null,
    store_email: values.store_email || null,
    store_logo: values.store_logo,
    store_phone: values.store_phone || null,
    store_address: {
      address_line_1: values.store_address?.address_line_1 || null,
      address_line_2: values.store_address?.address_line_2 || null,
      city: values.store_address?.city || null,
      state: values.store_address?.state || null,
      postal_code: values.store_address?.postal_code || null,
      country: values.store_address?.country || null,
    },
    selling_location_type: values.selling_location_type || null,
    selling_countries: values.selling_countries,
    order_number: {
      prefix: values.order_number?.prefix || '',
      suffix: values.order_number?.suffix || '',
    },
    invoice_number: {
      prefix: values.invoice_number?.prefix || '',
      sequence: values.invoice_number?.sequence || '000001',
      suffix: values.invoice_number?.suffix || '',
      apply_year_prefix: values.invoice_number?.apply_year_prefix || false,
      reset_sequence_every_year: values.invoice_number?.apply_year_prefix
        ? Boolean(values.invoice_number.reset_sequence_every_year)
        : false,
    },
    is_tax_calculation_enabled: values.is_tax_calculation_enabled,
  }),
);

export type GeneralSettingsFormInput = z.input<typeof GeneralSettingsFormSchema>;

export type GeneralSettingsFormPayload = z.output<typeof GeneralSettingsFormSchema>;
