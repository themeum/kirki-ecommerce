import { describe, expect, it } from 'vitest';

import { ConsentFormSchema } from '@/features/settings/legal/schemas/forms/consent-form';

const validInput = {
  title: 'Basic consents',
  show_on_signup: true,
  show_on_login: false,
  show_on_checkout: true,
  message: 'You agree to our {privacy_policy}.',
  method: 'mandatory_checkbox' as const,
};

describe('ConsentFormSchema', () => {
  it('produces the exact payload, flattening the booleans into locations', () => {
    expect(ConsentFormSchema.parse(validInput)).toEqual({
      title: 'Basic consents',
      message: 'You agree to our {privacy_policy}.',
      method: 'mandatory_checkbox',
      locations: ['signup', 'checkout'],
    });
  });

  it('orders locations signup, login, checkout regardless of input order', () => {
    const result = ConsentFormSchema.parse({
      ...validInput,
      show_on_signup: true,
      show_on_login: true,
      show_on_checkout: true,
    });

    expect(result.locations).toEqual(['signup', 'login', 'checkout']);
  });

  it('drops the booleans from the payload', () => {
    const result = ConsentFormSchema.parse(validInput);

    expect(result).not.toHaveProperty('show_on_signup');
    expect(result).not.toHaveProperty('show_on_login');
    expect(result).not.toHaveProperty('show_on_checkout');
  });

  it('rejects a consent with no location selected', () => {
    const result = ConsentFormSchema.safeParse({
      ...validInput,
      show_on_signup: false,
      show_on_login: false,
      show_on_checkout: false,
    });

    expect(result.success).toBe(false);

    const paths = result.success ? [] : result.error.issues.flatMap((issue) => issue.path);

    expect(paths).toContain('show_on_checkout');
  });

  it('rejects a blank title', () => {
    expect(ConsentFormSchema.safeParse({ ...validInput, title: '   ' }).success).toBe(false);
  });

  it('rejects a blank message', () => {
    expect(ConsentFormSchema.safeParse({ ...validInput, message: '' }).success).toBe(false);
  });

  it('defaults to a mandatory checkbox when no method is given', () => {
    const result = ConsentFormSchema.parse({
      title: 'Terms',
      message: 'Agree',
      show_on_checkout: true,
    });

    expect(result.method).toBe('mandatory_checkbox');
    expect(result.locations).toEqual(['checkout']);
  });

  it('selects no location by default', () => {
    expect(ConsentFormSchema.safeParse({ title: 'Terms', message: 'Agree' }).success).toBe(false);
  });

  it('rejects an unknown consent method', () => {
    expect(ConsentFormSchema.safeParse({ ...validInput, method: 'telepathy' }).success).toBe(false);
  });
});
