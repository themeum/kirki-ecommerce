import { describe, expect, it } from 'vitest';

import { AddStatePopupFormSchema } from '@/schemas/forms/add-state-popup-form';

describe('AddStatePopupFormSchema', () => {
  it('produces the exact payload', () => {
    expect(AddStatePopupFormSchema.parse({ selectedCountries: ['US', 'CA'] })).toEqual({
      selectedCountries: ['US', 'CA'],
    });
  });
});
