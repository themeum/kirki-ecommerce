import { describe, expect, it } from 'vitest';

import { AddStatesPopupFormSchema } from '@/features/settings/tax/strategies/general/schemas/forms/add-states-popup-form';

describe('AddStatesPopupFormSchema', () => {
  it('produces the exact payload', () => {
    const states = [{ id: 1, title: 'Berlin' }];
    expect(AddStatesPopupFormSchema.parse({ selectedStates: states })).toEqual({
      selectedStates: states,
    });
  });

  it('rejects an empty state selection', () => {
    expect(AddStatesPopupFormSchema.safeParse({ selectedStates: [] }).success).toBe(false);
  });
});
