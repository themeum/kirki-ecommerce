import { describe, expect, it } from 'vitest';

import { AddCitiesPopupFormSchema } from '@/schemas/forms/add-cities-popup-form';

describe('AddCitiesPopupFormSchema', () => {
  it('produces the exact payload', () => {
    const cities = [{ id: 1, title: 'Berlin' }];
    expect(AddCitiesPopupFormSchema.parse({ selectedCities: cities })).toEqual({
      selectedCities: cities,
    });
  });

  it('rejects an empty city selection', () => {
    expect(AddCitiesPopupFormSchema.safeParse({ selectedCities: [] }).success).toBe(false);
  });
});
