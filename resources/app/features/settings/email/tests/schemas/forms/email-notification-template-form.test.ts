import { describe, expect, it } from 'vitest';

import { EmailNotificationTemplateFormSchema } from '@/features/settings/email/schemas/forms/email-notification-template-form';

describe('EmailNotificationTemplateFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailNotificationTemplateFormSchema.parse({
      subject: 'Your order is confirmed',
      heading: 'Thank you for your order!',
      message: '<p>We are processing your order.</p>',
    });

    expect(result).toEqual({
      subject: 'Your order is confirmed',
      heading: 'Thank you for your order!',
      message: '<p>We are processing your order.</p>',
    });
  });

  it('falls back every field to an empty string when blank', () => {
    const result = EmailNotificationTemplateFormSchema.parse({
      subject: null,
      heading: null,
      message: null,
    });

    expect(result).toEqual({ subject: '', heading: '', message: '' });
  });
});
