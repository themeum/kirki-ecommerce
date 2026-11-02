import { describe, expect, it } from 'vitest';

import { getFormStepCount } from '@/features/onboarding/lib/steps';

describe('getFormStepCount', () => {
  it('counts the Store Tax step only when tax is collected', () => {
    expect(getFormStepCount(true)).toBe(4);
    expect(getFormStepCount(false)).toBe(3);
  });
});
