import { describe, expect, it } from 'vitest';

import { OfflinePaymentFormSchema } from '@/features/settings/payment/schemas/forms/offline-payment-form';

describe('OfflinePaymentFormSchema', () => {
  it('produces the exact payload, collapsing a media object icon to its id', () => {
    const result = OfflinePaymentFormSchema.parse({
      name: 'Cash on Delivery',
      icon: { id: 12, url: 'https://example.com/icon.png' },
      instructions: 'Pay on delivery',
      is_offline: true,
      is_enabled: true,
    });
    expect(result).toEqual({
      name: 'Cash on Delivery',
      icon: 12,
      instructions: 'Pay on delivery',
      is_offline: true,
      is_enabled: true,
    });
  });

  it('coerces a numeric string icon to an id and defaults instructions to null when blank', () => {
    const result = OfflinePaymentFormSchema.parse({
      name: 'Bank Transfer',
      icon: '34',
      instructions: '',
      is_enabled: false,
    });
    expect(result.icon).toBe(34);
    expect(result.instructions).toBeNull();
    expect(result.is_offline).toBe(true);
    expect(result.is_enabled).toBe(false);
  });

  it('rejects a blank required name', () => {
    expect(OfflinePaymentFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
