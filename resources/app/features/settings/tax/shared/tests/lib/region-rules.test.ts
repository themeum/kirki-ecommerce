import { describe, expect, it } from 'vitest';

import { applyRegionRules } from '@/features/settings/tax/shared/lib/region-rules';
import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';

const buildRegion = (overrides: Partial<TaxRegion> & { code: string }): TaxRegion =>
  ({ is_enabled: true, ...overrides }) as TaxRegion;

describe('applyRegionRules', () => {
  it('replaces only the matching region\'s rules', () => {
    const regions = [buildRegion({ code: 'US' }), buildRegion({ code: 'EU' })];
    const rules = [{ conditions: [], action: { type: 'set_tax_rate', value: 1 } }];

    const result = applyRegionRules(regions, 'EU', rules);

    expect(result[0]).toEqual(regions[0]);
    expect(result[1].rules).toEqual(rules);
  });
});
