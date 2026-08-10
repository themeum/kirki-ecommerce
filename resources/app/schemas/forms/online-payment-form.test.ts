import { describe, expect, it } from 'vitest';

import { OnlinePaymentEditFormSchema } from '@/schemas/forms/online-payment-form';

describe('OnlinePaymentEditFormSchema', () => {
  it('passes through arbitrary dynamic online payment settings fields', () => {
    const result = OnlinePaymentEditFormSchema.parse({
      api_key: 'sk_test_123',
      secret: 'shh',
      is_sandbox: true,
    });
    expect(result).toEqual({
      api_key: 'sk_test_123',
      secret: 'shh',
      is_sandbox: true,
    });
  });
});
