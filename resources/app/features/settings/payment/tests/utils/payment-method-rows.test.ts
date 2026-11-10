import { describe, expect, it } from 'vitest';

import {
  filterRowsByName,
  getGatewayIdsWithUpdate,
  getGatewayRowStatus,
  orderInstalledFirst,
} from '@/features/settings/payment/utils/payment-method-rows';

describe('getGatewayRowStatus', () => {
  it('is not-added when the gateway is not installed', () => {
    expect(getGatewayRowStatus({ id: 'klarna', is_installed: false })).toBe('not-added');
    expect(getGatewayRowStatus({ id: 'klarna' })).toBe('not-added');
  });

  it('is added when installed with no update', () => {
    expect(getGatewayRowStatus({ id: 'paypal', is_installed: true, update_available: false })).toBe(
      'added',
    );
  });

  it('is update-available when installed with an offered update', () => {
    expect(
      getGatewayRowStatus({ id: 'paystack', is_installed: true, update_available: true }),
    ).toBe('update-available');
  });

  it('is update-blocked when a blocked reason exists, even if an update is flagged', () => {
    expect(
      getGatewayRowStatus({
        id: 'paystack',
        is_installed: true,
        update_available: true,
        update_blocked_reason: 'Requires Kirki eCommerce 1.1.0',
      }),
    ).toBe('update-blocked');
  });
});

describe('orderInstalledFirst', () => {
  it('puts installed gateways first and keeps the API order inside each group', () => {
    const ids = orderInstalledFirst([
      { id: 'amazon', is_installed: false },
      { id: 'paypal', is_installed: true },
      { id: 'klarna', is_installed: false },
      { id: 'paystack', is_installed: true },
    ]);

    expect(ids).toEqual(['paypal', 'paystack', 'amazon', 'klarna']);
  });

  it('skips gateways without an id', () => {
    expect(orderInstalledFirst([{ name: 'No id', is_installed: true }, { id: 'paypal' }])).toEqual([
      'paypal',
    ]);
  });
});

describe('getGatewayIdsWithUpdate', () => {
  it('includes offered and blocked updates, and leaves out the rest', () => {
    const ids = getGatewayIdsWithUpdate([
      { id: 'paystack', is_installed: true, update_available: true },
      {
        id: 'mollie',
        is_installed: true,
        update_available: false,
        update_blocked_reason: 'This update needs PHP 8.1 or newer (you have 7.4).',
      },
      { id: 'paypal', is_installed: true, update_available: false },
      { id: 'klarna', is_installed: false },
      { is_installed: true, update_available: true },
    ]);

    expect([...ids]).toEqual(['paystack', 'mollie']);
  });
});

describe('filterRowsByName', () => {
  const rows = [
    { name: 'Cash on delivery' },
    { name: 'PayPal' },
    { name: 'Paystack' },
    { name: 'Klarna' },
  ];

  it('matches part of the name without regard to case', () => {
    expect(filterRowsByName(rows, 'PAY')).toEqual([{ name: 'PayPal' }, { name: 'Paystack' }]);
  });

  it('trims the query', () => {
    expect(filterRowsByName(rows, '  klar ')).toEqual([{ name: 'Klarna' }]);
  });

  it('returns all rows for an empty or blank query', () => {
    expect(filterRowsByName(rows, '')).toBe(rows);
    expect(filterRowsByName(rows, '   ')).toBe(rows);
  });

  it('treats a missing name as no match', () => {
    expect(filterRowsByName([{ name: null }, { name: 'PayPal' }], 'pay')).toEqual([
      { name: 'PayPal' },
    ]);
  });
});
