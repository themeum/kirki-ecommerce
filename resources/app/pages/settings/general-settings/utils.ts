export type StoreAddress = {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_province?: string | null;
  zip_code?: string | null;
  country?: string | null;
};

export type GeneralSettingsFormData = {
  store_name?: string;
  store_email?: string;
  store_logo?: string | number | null;
  store_phone?: string;
  store_address?: StoreAddress;
  selling_countries?: string[];
  selling_location_type?: string;
  order_id_prefix?: string;
  order_id_suffix?: string;
  invoice_id_prefix?: string;
  invoice_id_sequence?: string;
  invoice_id_suffix?: string;
  invoice_counter_reset_schedule?: string | null;
};

export const initialData: GeneralSettingsFormData = {
  store_name: '',
  store_email: '',
  store_logo: '',
  store_phone: '',
  store_address: {
    address_line_1: null,
    address_line_2: null,
    city: null,
    state_province: null,
    zip_code: null,
    country: null,
  },
  selling_countries: [],
  order_id_prefix: '',
  order_id_suffix: '',
  invoice_id_prefix: '',
  invoice_id_sequence: '',
  invoice_id_suffix: '',
  invoice_counter_reset_schedule: null,
};
