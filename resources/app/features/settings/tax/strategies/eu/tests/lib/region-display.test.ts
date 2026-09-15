import { describe, expect, it } from 'vitest';

import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import {
  resolveEuRegionBadges,
  resolveEuRegionRateLabel,
} from '@/features/settings/tax/strategies/eu/lib/region-display';

const buildRegion = (overrides: Partial<TaxRegion>): TaxRegion => ({
  code: 'EU',
  is_enabled: true,
  type: 'oss',
  ...overrides,
});

describe('resolveEuRegionRateLabel', () => {
  it('spans the member countries VAT rates', () => {
    const region = buildRegion({
      countries: [
        { code: 'DE', rate: 19 },
        { code: 'FR', rate: 20 },
      ],
    });

    expect(resolveEuRegionRateLabel(region)).toBe('19–20%');
  });

  it('collapses to one value when every member charges the same', () => {
    const region = buildRegion({
      countries: [
        { code: 'DE', rate: 20 },
        { code: 'FR', rate: 20 },
      ],
    });

    expect(resolveEuRegionRateLabel(region)).toBe('20%');
  });

  it('shows nothing when no member country is configured', () => {
    expect(resolveEuRegionRateLabel(buildRegion({ countries: [] }))).toBe('');
  });
});

describe('resolveEuRegionBadges', () => {
  it('separates the VAT scheme from the member count', () => {
    const badges = resolveEuRegionBadges(
      buildRegion({ type: 'oss', countries: [{ code: 'DE', rate: 19 }] }),
    );

    expect(badges).toHaveLength(2);
    expect(badges[0]).toEqual({ label: 'OSS', variant: 'info' });
    expect(badges[1].variant).toBe('default');
  });

  it('names the micro-business scheme', () => {
    const badges = resolveEuRegionBadges(buildRegion({ type: 'micro_business', countries: [] }));

    expect(badges[0]).toEqual({ label: 'Micro business', variant: 'info' });
  });

  it('omits the scheme badge when no scheme is chosen', () => {
    const badges = resolveEuRegionBadges(buildRegion({ type: null, countries: [] }));

    expect(badges).toHaveLength(1);
    expect(badges[0].variant).toBe('default');
  });
});
