import { z } from 'zod';

import { optionalNullableString } from '@/schemas/forms/shared/validators';

const StoreAddressSchema = z.object({
  address_line_1: optionalNullableString(),
  address_line_2: optionalNullableString(),
  city: optionalNullableString(),
  state_province: optionalNullableString(),
  zip_code: optionalNullableString(),
  country: optionalNullableString(),
});

export const GeneralSettingsFormSchema = z.object({
  store_name: z.string().optional().nullable(),
  store_email: z.string().optional().nullable(),
  store_logo: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  store_phone: optionalNullableString(),
  store_address: StoreAddressSchema.optional().nullable(),
  selling_location_type: z.string().optional().nullable(),
  selling_countries: z.array(z.string()).optional(),
  order_id_prefix: optionalNullableString(),
  order_id_suffix: optionalNullableString(),
  invoice_id_prefix: optionalNullableString(),
  invoice_id_sequence: optionalNullableString(),
  invoice_id_suffix: optionalNullableString(),
  invoice_counter_reset_schedule: optionalNullableString(),
});

export type GeneralSettingsFormValues = z.infer<typeof GeneralSettingsFormSchema>;

export const generalSettingsDefaultValues: GeneralSettingsFormValues = {
  store_name: '',
  store_email: '',
  store_logo: null,
  store_phone: '',
  store_address: {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province: '',
    zip_code: '',
    country: '',
  },
  selling_location_type: 'all-countries',
  selling_countries: [],
  order_id_prefix: '',
  order_id_suffix: '',
  invoice_id_prefix: '',
  invoice_id_sequence: '',
  invoice_id_suffix: '',
  invoice_counter_reset_schedule: 'none',
};
