import { describe, expect, it } from 'vitest';

import {
  buildCarrierFromPreset,
  getMissingCarrierPresets,
} from '@/features/settings/shipping/lib/shipping-carrier-presets';
import type {
  ShippingCarrier,
  ShippingCarrierPreset,
} from '@/features/settings/shipping/schemas/catalog/shipping';

const UPS: ShippingCarrierPreset = {
  key: 'ups',
  name: 'UPS',
  tracking_url: 'https://www.ups.com/track?tracknum={tracking_number}',
  logo_url: 'https://example.test/ups.svg',
};

const DHL: ShippingCarrierPreset = {
  key: 'dhl',
  name: 'DHL',
  tracking_url: 'https://www.dhl.com/track?id={tracking_number}',
  logo_url: 'https://example.test/dhl.svg',
};

describe('getMissingCarrierPresets', () => {
  it('lists every preset when the zone holds no carriers', () => {
    expect(getMissingCarrierPresets([UPS, DHL], [])).toEqual([UPS, DHL]);
  });

  it('hides a preset the zone already holds', () => {
    const carriers: ShippingCarrier[] = [{ id: 'ups', preset: 'ups', name: 'UPS' }];

    expect(getMissingCarrierPresets([UPS, DHL], carriers)).toEqual([DHL]);
  });

  it('keeps a preset when only a custom carrier shares its name', () => {
    const carriers: ShippingCarrier[] = [{ id: 'abc', preset: null, name: 'UPS' }];

    expect(getMissingCarrierPresets([UPS, DHL], carriers)).toEqual([UPS, DHL]);
  });

  it('lists a preset again once it is no longer in the zone', () => {
    expect(getMissingCarrierPresets([UPS, DHL], [])).toContain(UPS);
  });

  it('returns an empty list when the zone holds every preset', () => {
    const carriers: ShippingCarrier[] = [
      { id: 'ups', preset: 'ups' },
      { id: 'dhl', preset: 'dhl' },
    ];

    expect(getMissingCarrierPresets([UPS, DHL], carriers)).toEqual([]);
  });
});

describe('buildCarrierFromPreset', () => {
  it('builds an enabled carrier that uses the preset key as id', () => {
    expect(buildCarrierFromPreset(UPS)).toEqual({
      id: 'ups',
      preset: 'ups',
      name: 'UPS',
      tracking_url: UPS.tracking_url,
      logo: null,
      logo_url: UPS.logo_url,
      is_enabled: true,
    });
  });
});
