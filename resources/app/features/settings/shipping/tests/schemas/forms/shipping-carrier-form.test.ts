import { describe, expect, it } from 'vitest';

import { ShippingCarrierFormSchema } from '@/features/settings/shipping/schemas/forms/shipping-carrier-form';

const validInput = {
  name: 'UPS',
  tracking_url: 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
};

describe('ShippingCarrierFormSchema', () => {
  it('produces the exact payload', () => {
    expect(ShippingCarrierFormSchema.parse({ ...validInput, logo: 12 })).toEqual({
      name: 'UPS',
      tracking_url: 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
      logo: 12,
    });
  });

  it('reduces a picked media object to its attachment id', () => {
    const result = ShippingCarrierFormSchema.parse({
      ...validInput,
      logo: { id: '34', url: 'https://example.test/logo.png' },
    });

    expect(result.logo).toBe(34);
  });

  it('allows the logo to be omitted', () => {
    expect(ShippingCarrierFormSchema.parse(validInput).logo).toBeNull();
  });

  it('trims the name and the URL', () => {
    const result = ShippingCarrierFormSchema.parse({
      name: '  DHL  ',
      tracking_url: '  https://x.test/{tracking_number}  ',
    });

    expect(result.name).toBe('DHL');
    expect(result.tracking_url).toBe('https://x.test/{tracking_number}');
  });

  it('requires a name', () => {
    const result = ShippingCarrierFormSchema.safeParse({ ...validInput, name: '  ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['name']);
  });

  it('requires a URL', () => {
    const result = ShippingCarrierFormSchema.safeParse({ ...validInput, tracking_url: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['tracking_url']);
  });

  it('rejects a URL without the placeholder', () => {
    const result = ShippingCarrierFormSchema.safeParse({
      ...validInput,
      tracking_url: 'https://www.ups.com/track',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('{tracking_number}');
  });

  it('rejects a URL with a scheme other than http(s)', () => {
    const result = ShippingCarrierFormSchema.safeParse({
      ...validInput,
      tracking_url: 'javascript:alert({tracking_number})',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('http://');
  });
});
