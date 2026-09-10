import { describe, expect, it } from 'vitest';

import { GeneralSettingsFormSchema } from '@/features/settings/general/schemas/forms/general-settings-form';

describe('GeneralSettingsFormSchema', () => {
  const base = {
    store_name: 'Acme',
    store_email: 'store@acme.test',
    store_logo: null,
    store_phone: '',
    store_address: {
      address_line_1: '123 Main St',
      address_line_2: '',
      city: 'Metropolis',
      state: 'NY',
      postal_code: '10001',
      country: 'usa',
    },
    selling_location_type: 'all-countries',
    selling_countries: [],
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
      address_line_1: '123 Main St',
      address_line_2: null,
      city: 'Springfield',
      state: 'NY',
      postal_code: '10001',
      country: 'usa',
    });
  });

  it('sends null for a blank top-level field and blank optional address line', () => {
    const result = GeneralSettingsFormSchema.parse(base);
    expect(result.store_phone).toBeNull();
    expect(result.store_address.address_line_2).toBeNull();
  });

  it('collapses a media object store_logo to its numeric id', () => {
    const result = GeneralSettingsFormSchema.parse({
      ...base,
      store_logo: { id: 3, url: 'https://x/logo.png' },
    });
    expect(result.store_logo).toBe(3);
  });

  describe('order_number and invoice_number', () => {
    it('fills defaults when both objects are omitted', () => {
      const result = GeneralSettingsFormSchema.parse(base);
      expect(result.order_number).toEqual({ prefix: '', suffix: '' });
      expect(result.invoice_number).toEqual({
        prefix: '',
        sequence: '000001',
        suffix: '',
        apply_year_prefix: false,
        reset_sequence_every_year: false,
      });
    });

    it('passes submitted order_number and invoice_number values through', () => {
      const result = GeneralSettingsFormSchema.parse({
        ...base,
        order_number: { prefix: 'ORD-', suffix: '-X' },
        invoice_number: {
          prefix: 'INV-',
          sequence: '000042',
          suffix: '-Y',
          apply_year_prefix: true,
          reset_sequence_every_year: true,
        },
      });
      expect(result.order_number).toEqual({ prefix: 'ORD-', suffix: '-X' });
      expect(result.invoice_number).toEqual({
        prefix: 'INV-',
        sequence: '000042',
        suffix: '-Y',
        apply_year_prefix: true,
        reset_sequence_every_year: true,
      });
    });

    it('forces reset_sequence_every_year to false when apply_year_prefix is false', () => {
      const result = GeneralSettingsFormSchema.parse({
        ...base,
        invoice_number: {
          prefix: '',
          sequence: '000001',
          suffix: '',
          apply_year_prefix: false,
          reset_sequence_every_year: true,
        },
      });
      expect(result.invoice_number.reset_sequence_every_year).toBe(false);
    });

    it('rejects a non-digit invoice_number sequence', () => {
      expect(() =>
        GeneralSettingsFormSchema.parse({
          ...base,
          invoice_number: {
            prefix: '',
            sequence: '00A1',
            suffix: '',
            apply_year_prefix: false,
            reset_sequence_every_year: false,
          },
        }),
      ).toThrow();
    });
  });
});
