import { describe, expect, it } from 'vitest';

import { GeneralSettingsFormSchema } from '@/schemas/forms/general-settings-form';

describe('GeneralSettingsFormSchema', () => {
  const base = {
    store_name: 'Acme',
    store_email: 'store@acme.test',
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

  it('produces the exact payload for a fully filled form', () => {
    const result = GeneralSettingsFormSchema.parse({
      ...base,
      store_phone: '555-1234',
      store_address: { ...base.store_address, city: 'Springfield', country: 'usa' },
    });
    expect(result.store_name).toBe('Acme');
    expect(result.store_phone).toBe('555-1234');
    expect(result.store_address).toEqual({
      address_line_1: null,
      address_line_2: null,
      city: 'Springfield',
      state_province: null,
      zip_code: null,
      country: 'usa',
    });
  });

  it('sends null for blank top-level and nested address fields', () => {
    const result = GeneralSettingsFormSchema.parse(base);
    expect(result.store_phone).toBeNull();
    expect(result.store_address.address_line_1).toBeNull();
  });

  it('collapses a media object store_logo to its numeric id', () => {
    const result = GeneralSettingsFormSchema.parse({
      ...base,
      store_logo: { id: 3, url: 'https://x/logo.png' },
    });
    expect(result.store_logo).toBe(3);
  });
});
