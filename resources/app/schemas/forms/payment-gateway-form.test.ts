import { describe, expect, it } from 'vitest';

import { PaymentGatewayEditFormSchema } from '@/schemas/forms/payment-gateway-form';

describe('PaymentGatewayEditFormSchema', () => {
  it('passes through arbitrary dynamic gateway settings fields', () => {
    const result = PaymentGatewayEditFormSchema.parse({
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
