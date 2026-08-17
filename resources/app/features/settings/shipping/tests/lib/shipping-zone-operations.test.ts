import { describe, expect, it } from 'vitest';

import { getShippingMethodData, removeZone, toggleMethod } from '@/features/settings/shipping/lib/shipping-zone-operations';
import type { ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';

const buildMethod = (overrides: Partial<ShippingMethodData>): ShippingMethodData => ({
  id: 1,
  type: 'flat_rate',
  name: 'Standard',
  is_enabled: true,
  ...overrides,
});

const buildZone = (overrides: Partial<ShippingZone>): ShippingZone => ({
  id: 'zone-1',
  title: 'Zone',
  is_enabled: true,
  regions: [],
  shipping_methods: [],
  ...overrides,
});

describe('toggleMethod', () => {
  it('flips only the targeted method in a zone with several methods', () => {
    const zones = [
      buildZone({
        id: 'zone-1',
        shipping_methods: [
          buildMethod({ id: 1, is_enabled: true }),
          buildMethod({ id: 2, is_enabled: true }),
        ],
      }),
    ];

    const result = toggleMethod(zones, 'zone-1', 2);

    expect(result[0].shipping_methods).toEqual([
      buildMethod({ id: 1, is_enabled: true }),
      buildMethod({ id: 2, is_enabled: false }),
    ]);
  });

  it('treats an absent is_enabled as true, so toggling it turns it off', () => {
    const zones = [
      buildZone({
        id: 'zone-1',
        shipping_methods: [buildMethod({ id: 1, is_enabled: undefined })],
      }),
    ];

    const result = toggleMethod(zones, 'zone-1', 1);

    expect(result[0].shipping_methods[0].is_enabled).toBe(false);
  });

  it('leaves other zones untouched', () => {
    const zones = [
      buildZone({ id: 'zone-1', shipping_methods: [buildMethod({ id: 1, is_enabled: true })] }),
      buildZone({ id: 'zone-2', shipping_methods: [buildMethod({ id: 2, is_enabled: true })] }),
    ];

    const result = toggleMethod(zones, 'zone-1', 1);

    expect(result[1]).toEqual(zones[1]);
  });
});

describe('removeZone', () => {
  it('removes the targeted zone and keeps the rest', () => {
    const zones = [buildZone({ id: 'zone-1' }), buildZone({ id: 'zone-2' })];

    expect(removeZone(zones, 'zone-1')).toEqual([buildZone({ id: 'zone-2' })]);
  });

  it('returns an empty array when removing the last zone', () => {
    const zones = [buildZone({ id: 'zone-1' })];

    expect(removeZone(zones, 'zone-1')).toEqual([]);
  });
});

describe('getShippingMethodData', () => {
  it('enriches each method with its icon, text, and zone id', () => {
    const zones = [
      buildZone({
        id: 'zone-1',
        shipping_methods: [buildMethod({ id: 1, type: 'local_pickup', description: 'Pick up in store' })],
      }),
    ];

    const result = getShippingMethodData(zones, 'zone-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, subText: 'Pick up in store', zoneId: 'zone-1' });
    expect(result[0].icon).toBeTruthy();
  });

  it('returns an empty array for a zone with no methods', () => {
    const zones = [buildZone({ id: 'zone-1', shipping_methods: [] })];

    expect(getShippingMethodData(zones, 'zone-1')).toEqual([]);
  });

  it('returns an empty array when the zone id does not match any zone', () => {
    const zones = [buildZone({ id: 'zone-1' })];

    expect(getShippingMethodData(zones, 'missing')).toEqual([]);
  });
});
