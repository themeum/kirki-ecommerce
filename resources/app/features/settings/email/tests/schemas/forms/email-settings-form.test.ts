import { describe, expect, it } from 'vitest';

import { EmailSettingsFormSchema } from '@/features/settings/email/schemas/forms/email-settings-form';

describe('EmailSettingsFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailSettingsFormSchema.parse({
      admin_emails: {
        order_notifications: { order_confirmation: { is_enabled: true } },
      },
      customer_emails: {},
      default_template: null,
    });

    expect(result.admin_emails.order_notifications).toEqual({
      order_confirmation: { is_enabled: true },
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
          order_confirmation: { is_enabled: true, subject: 'You have a new order' },
        },
      },
      customer_emails: {},
    });
    expect(result.admin_emails.order_notifications?.order_confirmation.subject).toBe('You have a new order');
  });

  it('keeps a fully-populated default_template, reducing logo to its id', () => {
    const template = {
      logo: { id: 5, url: 'https://x/logo.png' },
      height: 60,
      position: 'center',
      colors: {
        background: { email_body: '#fff', outer_area: '#eee', info_cads: '#ddd', divider: '#ccc' },
        typography: { headings: '#000', body: '#111', muted: '#222', link: '#00f', exceptions: '#f00' },
        button: { background: '#0a0', text: '#fff' },
      },
      additional_description: null,
      footer: null,
    };
    const result = EmailSettingsFormSchema.parse({
      admin_emails: {},
      customer_emails: {},
      default_template: template,
    });
    expect(result.default_template).toEqual({ ...template, logo: template.logo.id });
  });
});
