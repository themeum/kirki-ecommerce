import { describe, expect, it } from 'vitest';

import { detectCountry } from '@/features/onboarding/lib/detect-country';

describe('detectCountry', () => {
  const knownCountryCodes = ['BD', 'GB', 'IN', 'US'];

  it('detects the country from the time zone', () => {
    expect(detectCountry(knownCountryCodes, { timeZone: 'Asia/Dhaka', languages: ['en-US'] })).toBe(
      'BD',
    );
  });

  it('detects the country from a legacy time zone alias', () => {
    expect(detectCountry(knownCountryCodes, { timeZone: 'Asia/Calcutta', languages: [] })).toBe(
      'IN',
    );
  });

  it('falls back to the preferred language region when the time zone is not specific', () => {
    expect(detectCountry(knownCountryCodes, { timeZone: 'UTC', languages: ['en-GB', 'en-US'] })).toBe(
      'GB',
    );
  });

  it('returns an empty string when nothing identifies a known country', () => {
    expect(detectCountry(knownCountryCodes, { timeZone: 'UTC', languages: ['en'] })).toBe('');
  });

  it('ignores a detected country that is not in the known list', () => {
    expect(detectCountry(knownCountryCodes, { timeZone: 'Asia/Tokyo', languages: ['ja-JP'] })).toBe(
      '',
    );
  });
});
