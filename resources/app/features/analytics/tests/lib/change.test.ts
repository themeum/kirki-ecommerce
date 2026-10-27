import { describe, expect, it } from 'vitest';

import { getChangeBadge } from '@/features/analytics/lib/change';

describe('getChangeBadge', () => {
  it('shows an increase with one decimal and an up direction', () => {
    expect(getChangeBadge(12.3)).toEqual({ text: '12.3%', direction: 'up' });
  });

  it('shows a decrease without a minus sign and a down direction', () => {
    expect(getChangeBadge(-4)).toEqual({ text: '4.0%', direction: 'down' });
  });

  it('shows no change as flat', () => {
    expect(getChangeBadge(0)).toEqual({ text: '0.0%', direction: 'flat' });
  });

  it('is empty when the change is empty (zero comparison or no comparison)', () => {
    expect(getChangeBadge(null)).toBeNull();
    expect(getChangeBadge(undefined)).toBeNull();
  });
});
