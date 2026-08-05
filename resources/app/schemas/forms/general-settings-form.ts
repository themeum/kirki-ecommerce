import { z } from 'zod';

import { mediaId, prepareFormSchema } from '@/libs/zod';

const StoreAddressFormShape = z.object({
  address_line_1: z.string().nullish().default(''),
  address_line_2: z.string().nullish().default(''),
  city: z.string().nullish().default(''),
  state_province: z.string().nullish().default(''),
  zip_code: z.string().nullish().default(''),
  country: z.string().nullish().default(''),
});

const GeneralSettingsFormShape = z.object({
  store_name: z.string().nullish().default(''),
  store_email: z.string().nullish().default(''),
  store_logo: mediaId(),
  store_phone: z.string().nullish().default(''),
  store_address: StoreAddressFormShape.default({}),
  selling_location_type: z.string().nullish().default('all-countries'),
  selling_countries: z.array(z.string()).default([]),
  order_id_prefix: z.string().nullish().default(''),
  order_id_suffix: z.string().nullish().default(''),
  invoice_id_prefix: z.string().nullish().default(''),
  invoice_id_sequence: z.string().nullish().default(''),
  invoice_id_suffix: z.string().nullish().default(''),
  invoice_counter_reset_schedule: z.string().nullish().default('none'),
});

export const GeneralSettingsFormSchema = prepareFormSchema(GeneralSettingsFormShape).transform((values) => ({
  store_name: values.store_name || null,
  store_email: values.store_email || null,
  store_logo: values.store_logo,
  store_phone: values.store_phone || null,
  store_address: {
    address_line_1: values.store_address.address_line_1 || null,
    address_line_2: values.store_address.address_line_2 || null,
    city: values.store_address.city || null,
    state_province: values.store_address.state_province || null,
    zip_code: values.store_address.zip_code || null,
    country: values.store_address.country || null,
  },
  selling_location_type: values.selling_location_type || null,
  selling_countries: values.selling_countries,
  order_id_prefix: values.order_id_prefix || null,
  order_id_suffix: values.order_id_suffix || null,
  invoice_id_prefix: values.invoice_id_prefix || null,
  invoice_id_sequence: values.invoice_id_sequence || null,
  invoice_id_suffix: values.invoice_id_suffix || null,
  invoice_counter_reset_schedule: values.invoice_counter_reset_schedule || null,
}));

export type GeneralSettingsFormInput = z.input<typeof GeneralSettingsFormSchema>;

export type GeneralSettingsFormPayload = z.output<typeof GeneralSettingsFormSchema>;
