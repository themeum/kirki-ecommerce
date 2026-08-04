import { describe, expect, it } from 'vitest';

import { EmailSettingsFormSchema } from '@/schemas/forms/email-settings-form';

describe('EmailSettingsFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailSettingsFormSchema.parse({
      admin_emails: {
        order_notifications: { new_order: { name: 'New order', is_enabled: true } },
      },
      customer_emails: {},
      default_template: null,
    });

    expect(result.admin_emails.order_notifications).toEqual({
      new_order: { name: 'New order', is_enabled: true },
    });
    expect(result.customer_emails).toEqual({});
  });

  it('defaults admin_emails and customer_emails to empty objects', () => {
    const result = EmailSettingsFormSchema.parse({});
    expect(result.admin_emails).toEqual({});
    expect(result.customer_emails).toEqual({});
    expect(result.default_template).toBeNull();
  });

  it('preserves extra per-notification fields via passthrough', () => {
    const result = EmailSettingsFormSchema.parse({
      admin_emails: {
        order_notifications: {
          new_order: { name: 'New order', is_enabled: true, subject: 'You have a new order' },
        },
      },
      customer_emails: {},
    });
    expect(result.admin_emails.order_notifications?.new_order.subject).toBe('You have a new order');
  });

  it('round-trips an unedited default_template unchanged', () => {
    const template = { logo: 'https://x/logo.png', height: '60px', position: 'center' };
    const result = EmailSettingsFormSchema.parse({
      admin_emails: {},
      customer_emails: {},
      default_template: template,
    });
    expect(result.default_template).toEqual(template);
  });
});
