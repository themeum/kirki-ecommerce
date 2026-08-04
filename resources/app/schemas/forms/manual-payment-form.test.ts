import { describe, expect, it } from 'vitest';

import { ManualPaymentFormSchema } from '@/schemas/forms/manual-payment-form';

describe('ManualPaymentFormSchema', () => {
  it('produces the exact payload, collapsing a media object icon to its url', () => {
    const result = ManualPaymentFormSchema.parse({
      name: 'Cash on Delivery',
      icon: { url: 'https://example.com/icon.png' },
      instructions: 'Pay on delivery',
      is_manual: true,
      is_enabled: true,
    });
    expect(result).toEqual({
      name: 'Cash on Delivery',
      icon: 'https://example.com/icon.png',
      instructions: 'Pay on delivery',
      is_manual: true,
      is_enabled: true,
    });
  });

  it('passes through a string icon and defaults instructions to null when blank', () => {
    const result = ManualPaymentFormSchema.parse({
      name: 'Bank Transfer',
      icon: 'https://example.com/bank.png',
      instructions: '',
      is_enabled: false,
    });
    expect(result.icon).toBe('https://example.com/bank.png');
    expect(result.instructions).toBeNull();
    expect(result.is_manual).toBe(true);
    expect(result.is_enabled).toBe(false);
  });

  it('rejects a blank required name', () => {
    expect(ManualPaymentFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
