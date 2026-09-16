import { describe, expect, it } from 'vitest';

import {
  hasEnabledSignupConsent,
  removeConsent,
  sortLocations,
  toggleConsent,
  upsertConsent,
} from '@/features/settings/legal/lib/utils';
import type { Consent } from '@/features/settings/legal/schemas/catalog/legal';

const consent = (overrides: Partial<Consent> = {}): Consent =>
  ({
    id: 'a',
    title: 'Terms',
    locations: ['checkout'],
    message: 'Agree',
    method: 'mandatory_checkbox',
    is_enabled: true,
    ...overrides,
  });

describe('upsertConsent', () => {
  it('appends a consent whose id is not present', () => {
    const result = upsertConsent([consent()], consent({ id: 'b' }));

    expect(result.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('replaces the matching consent in place', () => {
    const result = upsertConsent(
      [consent(), consent({ id: 'b' })],
      consent({ id: 'a', title: 'Updated' }),
    );

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Updated');
    expect(result[1].title).toBe('Terms');
  });
});

describe('toggleConsent', () => {
  it('flips only the matching consent', () => {
    const result = toggleConsent([consent(), consent({ id: 'b' })], 'a');

    expect(result[0].is_enabled).toBe(false);
    expect(result[1].is_enabled).toBe(true);
  });

  it('treats a missing flag as enabled', () => {
    const result = toggleConsent([consent({ is_enabled: undefined })], 'a');

    expect(result[0].is_enabled).toBe(false);
  });
});

describe('removeConsent', () => {
  it('removes only the matching consent', () => {
    const result = removeConsent([consent(), consent({ id: 'b' })], 'a');

    expect(result.map((item) => item.id)).toEqual(['b']);
  });

  it('leaves the list alone when nothing matches', () => {
    const list = [consent()];

    expect(removeConsent(list, 'missing')).toHaveLength(1);
  });
});

describe('sortLocations', () => {
  it('orders locations signup, login, checkout', () => {
    expect(sortLocations(['checkout', 'signup'])).toEqual(['signup', 'checkout']);
  });
});

describe('hasEnabledSignupConsent', () => {
  it('is true for an enabled signup consent', () => {
    expect(hasEnabledSignupConsent([consent({ locations: ['signup'] })])).toBe(true);
  });

  it('is false when the signup consent is disabled', () => {
    expect(
      hasEnabledSignupConsent([consent({ locations: ['signup'], is_enabled: false })]),
    ).toBe(false);
  });

  it('is false when no consent targets signup', () => {
    expect(hasEnabledSignupConsent([consent()])).toBe(false);
  });
});
