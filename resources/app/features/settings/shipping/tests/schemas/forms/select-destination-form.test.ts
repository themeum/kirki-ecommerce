import { describe, expect, it } from 'vitest';

import { SelectDestinationFormSchema } from '@/features/settings/shipping/schemas/forms/select-destination-form';

describe('SelectDestinationFormSchema', () => {
  it('produces the exact payload', () => {
    const result = SelectDestinationFormSchema.parse({ country: 'US', states: ['CA', 'NY'] });
    expect(result).toEqual({ country: 'US', states: ['CA', 'NY'] });
  });

  it('defaults states to an empty array', () => {
    const result = SelectDestinationFormSchema.parse({ country: 'US' });
    expect(result.states).toEqual([]);
  });

  it('rejects a blank required country', () => {
    expect(SelectDestinationFormSchema.safeParse({ country: '  ', states: [] }).success).toBe(false);
  });
});
