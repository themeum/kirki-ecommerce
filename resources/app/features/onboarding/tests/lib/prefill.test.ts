import { describe, expect, it } from 'vitest';

import { toFormPrefill } from '@/features/onboarding/lib/prefill';

const options = { countryCodes: ['US', 'BD'], currencyCodes: ['USD', 'BDT'] };

const woocommerce = (values: Record<string, unknown>) =>
  ({ source: 'woocommerce' as const, values }) as Parameters<typeof toFormPrefill>[0];

describe('toFormPrefill', () => {
  it('returns nothing without WooCommerce', () => {
    expect(toFormPrefill({ source: null, values: {} }, options)).toEqual({});
    expect(toFormPrefill(undefined, options)).toEqual({});
  });

  it('passes the WooCommerce answers through', () => {
    const prefill = toFormPrefill(
      woocommerce({
        store_name: 'Acme',
        industry: 'other',
        country: 'US',
        store_address: { city: 'Austin' },
        currency: 'USD',
        is_tax_enabled: true,
        is_tax_inclusive_price: true,
      }),
      options,
    );

    expect(prefill).toEqual({
      store_name: 'Acme',
      industry: 'other',
      country: 'US',
      store_address: { city: 'Austin' },
      currency: 'USD',
      is_tax_enabled: true,
      is_tax_inclusive_price: true,
    });
  });

  it('drops a country or currency that Kirki does not know, and the address with the country', () => {
    const prefill = toFormPrefill(
      woocommerce({ country: 'ZZ', store_address: { city: 'Nowhere' }, currency: 'ZZZ' }),
      options,
    );

    expect(prefill).toEqual({});
  });
});
