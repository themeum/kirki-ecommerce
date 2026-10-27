import { describe, expect, it } from 'vitest';

import { OrderContactFormSchema } from '@/features/orders/schemas/forms/order-contact-form';

describe('OrderContactFormSchema', () => {
  it('accepts a first and last name and nulls the empty optional fields', () => {
    const result = OrderContactFormSchema.safeParse({
      first_name: 'John',
      last_name: 'Doe',
      email: '',
      phone: '  ',
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      first_name: 'John',
      last_name: 'Doe',
      email: null,
      phone: null,
    });
  });

  it('trims the optional fields', () => {
    const result = OrderContactFormSchema.parse({
      first_name: 'John',
      last_name: 'Doe',
      email: ' john@example.com ',
      phone: ' 555 ',
    });

    expect(result.email).toBe('john@example.com');
    expect(result.phone).toBe('555');
  });

  it('requires the first and last name', () => {
    const result = OrderContactFormSchema.safeParse({
      first_name: '',
      last_name: null,
      email: null,
      phone: null,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      'first_name',
      'last_name',
    ]);
  });
});
