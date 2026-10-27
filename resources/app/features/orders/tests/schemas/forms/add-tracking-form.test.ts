import { describe, expect, it } from 'vitest';

import {
  AddTrackingFormSchema,
  OTHER_CARRIER_VALUE,
} from '@/features/orders/schemas/forms/add-tracking-form';

describe('AddTrackingFormSchema', () => {
  it('sends only the carrier id and number for a listed carrier', () => {
    expect(
      AddTrackingFormSchema.parse({
        carrier: 'ups',
        tracking_number: '  1Z999  ',
        other_name: '',
        other_url: '',
      }),
    ).toEqual({ carrier_id: 'ups', tracking_number: '1Z999' });
  });

  it('ignores the other fields for a listed carrier', () => {
    const result = AddTrackingFormSchema.parse({
      carrier: 'ups',
      tracking_number: '1Z999',
      other_name: 'Leftover',
      other_url: 'not a url',
    });

    expect(result).toEqual({ carrier_id: 'ups', tracking_number: '1Z999' });
  });

  it('sends the name and template for Other', () => {
    expect(
      AddTrackingFormSchema.parse({
        carrier: OTHER_CARRIER_VALUE,
        tracking_number: 'AB12',
        other_name: ' Local Courier ',
        other_url: 'https://track.example.com/?n={tracking_number}',
      }),
    ).toEqual({
      carrier: 'Local Courier',
      tracking_number: 'AB12',
      tracking_url: 'https://track.example.com/?n={tracking_number}',
    });
  });

  it('requires a carrier and a tracking number', () => {
    const result = AddTrackingFormSchema.safeParse({ carrier: '', tracking_number: ' ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      'carrier',
      'tracking_number',
    ]);
  });

  it('requires a name for Other', () => {
    const result = AddTrackingFormSchema.safeParse({
      carrier: OTHER_CARRIER_VALUE,
      tracking_number: 'AB12',
      other_name: ' ',
      other_url: 'https://track.example.com/?n={tracking_number}',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['other_name']);
  });

  it('requires a template with the placeholder for Other', () => {
    const result = AddTrackingFormSchema.safeParse({
      carrier: OTHER_CARRIER_VALUE,
      tracking_number: 'AB12',
      other_name: 'Courier',
      other_url: 'https://track.example.com/',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['other_url']);
    expect(result.error?.issues[0].message).toContain('{tracking_number}');
  });

  it('rejects an Other URL with an unsafe scheme', () => {
    const result = AddTrackingFormSchema.safeParse({
      carrier: OTHER_CARRIER_VALUE,
      tracking_number: 'AB12',
      other_name: 'Courier',
      other_url: 'javascript:alert({tracking_number})',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('http://');
  });
});
