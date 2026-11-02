import { describe, expect, it } from 'vitest';

import { getWelcomeName } from '@/features/home/lib/greeting';

describe('getWelcomeName', () => {
  it('uses the first name when there is one', () => {
    expect(getWelcomeName({ id: 1, first_name: 'Sara', display_name: 'store-admin' })).toBe('Sara');
  });

  it('falls back to the display name when the first name is empty', () => {
    expect(getWelcomeName({ id: 1, first_name: '  ', display_name: 'store-admin' })).toBe(
      'store-admin',
    );
  });

  it('returns null when the user has no name or is missing', () => {
    expect(getWelcomeName({ id: 1, first_name: null, display_name: '' })).toBeNull();
    expect(getWelcomeName(null)).toBeNull();
  });
});
