import { describe, expect, it } from 'vitest';

import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import {
  resolveGeneralRegionBadges,
  resolveGeneralRegionRateLabel,
} from '@/features/settings/tax/strategies/general/lib/region-display';

const buildRegion = (overrides: Partial<TaxRegion>): TaxRegion =>
  ({ code: 'CA', is_enabled: true, ...overrides }) as TaxRegion;

describe('resolveGeneralRegionRateLabel', () => {
  it('shows the country-wide rate when one rate covers the region', () => {
    const region = buildRegion({
      is_central_tax_enabled: true,
      central_product_tax: 20,
      states: [{ id: '1', product_tax_rate: 5 }],
    });

    expect(resolveGeneralRegionRateLabel(region)).toBe('20%');
  });

  it('spans the states when the region charges per state', () => {
    const region = buildRegion({
      is_central_tax_enabled: false,
      central_product_tax: 20,
      states: [
        { id: '1', product_tax_rate: 5 },
        { id: '2', product_tax_rate: 12 },
      ],
    });

    expect(resolveGeneralRegionRateLabel(region)).toBe('5–12%');
  });

  it('shows nothing for a per-state region with no states configured', () => {
    expect(resolveGeneralRegionRateLabel(buildRegion({ is_central_tax_enabled: false }))).toBe('');
  });
});

describe('resolveGeneralRegionBadges', () => {
  it('describes a country-wide region as covering the entire country', () => {
    const badges = resolveGeneralRegionBadges(buildRegion({ is_central_tax_enabled: true }));

    expect(badges).toEqual([{ label: 'Entire country', variant: 'default' }]);
  });

  it('falls back to entire country when no state is configured', () => {
    const badges = resolveGeneralRegionBadges(
      buildRegion({ is_central_tax_enabled: false, states: [] }),
    );

    expect(badges).toEqual([{ label: 'Entire country', variant: 'default' }]);
  });

  it('describes a per-state region by its state count alone', () => {
    const badges = resolveGeneralRegionBadges(
      buildRegion({
        is_central_tax_enabled: false,
        states: [
          { id: '1', product_tax_rate: 5 },
          { id: '2', product_tax_rate: 12 },
        ],
      }),
    );

    expect(badges).toHaveLength(1);
    expect(badges[0].variant).toBe('default');
  });
});
