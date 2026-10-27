import { describe, expect, it } from 'vitest';

import { getCurrencyFlag } from '@/features/onboarding/lib/currency-flag';

describe('getCurrencyFlag', () => {
  const knownCountryCodes = ['US', 'BD', 'JP'];

  it('uses the issuing country flag for a national currency', () => {
    expect(getCurrencyFlag('USD', knownCountryCodes)).toBe('🇺🇸');
    expect(getCurrencyFlag('bdt', knownCountryCodes)).toBe('🇧🇩');
  });

  it('uses the EU flag for the euro', () => {
    expect(getCurrencyFlag('EUR', knownCountryCodes)).toBe('🇪🇺');
  });

  it('shows no flag for a supranational currency', () => {
    expect(getCurrencyFlag('XAF', knownCountryCodes)).toBe('');
  });
});
