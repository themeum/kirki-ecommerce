import { describe, expect, it } from 'vitest';

import { getShippingMethodRightText } from '@/features/settings/shipping/lib/utils';
import type { ShippingMethodData } from '@/features/settings/shipping/types';

const buildMethod = (overrides: Partial<ShippingMethodData>): ShippingMethodData => ({
  id: 1,
  type: 'weight',
  name: 'Rate by weight',
  is_enabled: true,
  ...overrides,
});

describe('getShippingMethodRightText', () => {
  it('shows the span between the cheapest and dearest weight range', () => {
    const method = buildMethod({
      ranges: [
        { from: 0, to: 5, base_amount: 10 },
        { from: 5, to: 10, base_amount: 20 },
        { from: 10, to: 20, base_amount: 15 },
      ],
    });

    expect(getShippingMethodRightText(method, '€')).toBe('€10 - €20');
  });

  it('collapses to a single amount when every range costs the same', () => {
    const method = buildMethod({
      ranges: [
        { from: 0, to: 5, base_amount: 12 },
        { from: 5, to: 10, base_amount: 12 },
      ],
    });

    expect(getShippingMethodRightText(method, '€')).toBe('€12');
  });

  it('ignores ranges that carry no amount yet', () => {
    const method = buildMethod({
      ranges: [
        { from: 0, to: 5, base_amount: null },
        { from: 5, to: 10, base_amount: '' },
        { from: 10, to: 20, base_amount: '8' },
      ],
    });

    expect(getShippingMethodRightText(method, '€')).toBe('€8');
  });

  it('omits the symbol entirely when the base currency is not resolved yet', () => {
    const method = buildMethod({ type: 'flat_rate', base_amount: 25 });

    expect(getShippingMethodRightText(method)).toBe('25');
  });

  it('shows nothing for a weight method with no priced range', () => {
    expect(getShippingMethodRightText(buildMethod({ ranges: [] }))).toBeUndefined();
    expect(getShippingMethodRightText(buildMethod({}))).toBeUndefined();
  });

  it('leaves the flat rate and local pickup amounts as they were', () => {
    expect(
      getShippingMethodRightText(buildMethod({ type: 'flat_rate', base_amount: 25 }), '€'),
    ).toBe('€25');
    expect(
      getShippingMethodRightText(
        buildMethod({ type: 'local_pickup', has_fee: true, base_amount: 5 }),
        '€',
      ),
    ).toBe('€5');
    expect(
      getShippingMethodRightText(buildMethod({ type: 'local_pickup', base_amount: 5 })),
    ).toBeUndefined();
  });
});
