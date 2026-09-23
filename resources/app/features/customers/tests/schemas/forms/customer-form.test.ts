import { beforeEach, describe, expect, it } from 'vitest';

import { CustomerFormSchema } from '@/features/customers/schemas/forms/customer-form';
import { cacheAddressRules } from '@/libs/address-rules';

describe('CustomerFormSchema', () => {
  const base = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    language: 'english',
    accepts_marketing: false,
    photo: null,
    addresses: [],
    tags: [],
  };

  it('rejects a blank required first name', () => {
    expect(CustomerFormSchema.safeParse({ ...base, first_name: '  ' }).success).toBe(false);
  });

  it('rejects a missing or invalid email', () => {
    expect(CustomerFormSchema.safeParse({ ...base, email: '' }).success).toBe(false);
    expect(CustomerFormSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts a valid email with no addresses submitted', () => {
    expect(CustomerFormSchema.safeParse(base).success).toBe(true);
  });

  it('collapses a media object photo to its numeric id', () => {
    const result = CustomerFormSchema.parse({
      ...base,
      photo: { id: 4, url: 'https://x/photo.png' },
    });
    expect(result.photo).toBe(4);
  });

  describe('addresses', () => {
    it('rejects a row left at its defaults (type "home", no country) rather than saving it', () => {
      const result = CustomerFormSchema.safeParse({
        ...base,
        addresses: [{ type: 'home', is_default_shipping: false, is_default_billing: false }],
      });

      expect(result.success).toBe(false);
    });

    it('does not require every other field just because a blank row is present', () => {
      const result = CustomerFormSchema.safeParse({
        ...base,
        addresses: [{}],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join('.'));
        expect(paths).toEqual(['addresses.0.country']);
      }
    });

    it('requires the core fields once any of them is filled in', () => {
      const result = CustomerFormSchema.safeParse({
        ...base,
        addresses: [{ first_name: 'Jane' }],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join('.'));
        expect(paths).toContain('addresses.0.address_line1');
        expect(paths).toContain('addresses.0.country');
      }
    });

    it('accepts and keeps a touched row with every core field filled in', () => {
      const result = CustomerFormSchema.safeParse({
        ...base,
        addresses: [
          {
            first_name: 'Jane',
            email: 'jane@example.com',
            phone: '555-1234',
            address_line1: '1 Main St',
            city: 'Springfield',
            country: 'US',
          },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.addresses).toHaveLength(1);
      }
    });

    it('requires a label when the type is "others"', () => {
      const touched = {
        first_name: 'Jane',
        email: 'jane@example.com',
        phone: '555-1234',
        address_line1: '1 Main St',
        city: 'Springfield',
        country: 'US',
      };

      const withoutLabel = CustomerFormSchema.safeParse({
        ...base,
        addresses: [{ ...touched, type: 'others' }],
      });
      expect(withoutLabel.success).toBe(false);

      const withLabel = CustomerFormSchema.safeParse({
        ...base,
        addresses: [{ ...touched, type: 'others', label: 'Warehouse' }],
      });
      expect(withLabel.success).toBe(true);
    });

    describe('state follows the country', () => {
      beforeEach(() => {
        cacheAddressRules([
          {
            name: 'Japan',
            code: 'JP',
            states: [],
            address_rules: {
              state: { mode: 'required', label: 'Prefecture' },
              postal_code: { mode: 'required' },
            },
          },
          {
            name: 'Singapore',
            code: 'SG',
            states: [],
            address_rules: {
              state: { mode: 'hidden', label: 'Council' },
              postal_code: { mode: 'optional' },
            },
          },
        ]);
      });

      const touched = {
        first_name: 'Jane',
        email: 'jane@example.com',
        phone: '555-1234',
        address_line1: '1 Main St',
        city: 'Springfield',
      };

      it('rejects a missing state when the country requires one', () => {
        const result = CustomerFormSchema.safeParse({
          ...base,
          addresses: [{ ...touched, country: 'JP', state: '' }],
        });

        expect(result.success).toBe(false);
      });

      it('accepts a missing state when the country has none', () => {
        const result = CustomerFormSchema.safeParse({
          ...base,
          addresses: [{ ...touched, country: 'SG', state: '' }],
        });

        expect(result.success).toBe(true);
      });
    });
  });
});
