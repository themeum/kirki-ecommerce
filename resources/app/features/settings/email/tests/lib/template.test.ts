import { describe, expect, it } from 'vitest';

import {
  buildEmailTemplatePayload,
  positionToTabIndex,
  resolveLogoUrl,
  resolveTemplateFormOverrides,
  tabIndexToPosition,
} from '@/features/settings/email/lib/template';
import type { EmailTemplateFormPayload } from '@/features/settings/email/schemas/forms/email-template-form';

describe('resolveLogoUrl', () => {
  it('returns an empty string when there is no logo', () => {
    expect(resolveLogoUrl(null)).toBe('');
    expect(resolveLogoUrl(undefined)).toBe('');
  });

  it('passes a string logo through as-is', () => {
    expect(resolveLogoUrl('https://example.test/logo.png')).toBe('https://example.test/logo.png');
  });

  it('reads the url off a media object', () => {
    expect(resolveLogoUrl({ id: 1, url: 'https://example.test/logo.png' })).toBe('https://example.test/logo.png');
  });

  it('returns an empty string for an object with no url', () => {
    expect(resolveLogoUrl({ id: 1 })).toBe('');
  });
});

describe('positionToTabIndex / tabIndexToPosition', () => {
  it('maps each named position to its tab index and back', () => {
    expect(positionToTabIndex('start')).toBe('0');
    expect(positionToTabIndex('center')).toBe('1');
    expect(positionToTabIndex('end')).toBe('2');

    expect(tabIndexToPosition('0')).toBe('start');
    expect(tabIndexToPosition('1')).toBe('center');
    expect(tabIndexToPosition('2')).toBe('end');
  });

  it('defaults an unknown position to the first tab', () => {
    expect(positionToTabIndex('diagonal')).toBe('0');
    expect(positionToTabIndex(null)).toBe('0');
  });

  it('defaults an out-of-range tab index to start', () => {
    expect(tabIndexToPosition('9')).toBe('start');
  });
});

describe('resolveTemplateFormOverrides', () => {
  it('includes the logo override when a full media ref is already available', () => {
    const logo = { id: 5, url: 'https://example.test/logo.png' };
    const result = resolveTemplateFormOverrides({ logo, height: '64' });

    expect(result).toEqual({ logo, height: 64 });
  });

  it('omits the logo override when only a bare attachment id is saved', () => {
    expect(resolveTemplateFormOverrides({ logo: '5', height: '64' })).toEqual({ height: 64 });
  });

  it('defaults the height to 50 when it does not parse', () => {
    expect(resolveTemplateFormOverrides({ logo: null, height: 'tall' })).toEqual({ height: 50 });
  });
});

describe('buildEmailTemplatePayload', () => {
  const currentEmailSettings = {
    admin_emails: { order_notifications: {}, user_notifications: {}, inventory_notifications: {} },
    customer_emails: { order_notifications: {}, user_notifications: {}, inventory_notifications: {} },
    mail_configuration: null,
  };
  const payload: EmailTemplateFormPayload = {
    logo: '5',
    height: 64,
    position: 'center',
    colors: {
      background: { email_body: '#fff', outer_area: '#DBDBE5', info_cads: '#F5F5F5', divider: '#E0E0E0' },
      typography: { headings: '#000000', body: '#000000', muted: '#474747', link: '#167BFF', exceptions: '#0078CE' },
      button: { background: '#167BFF', text: '#FFFFFF' },
    },
    additional_description: null,
    footer: null,
  };

  it('merges the edited template fields over the existing default_template', () => {
    const result = buildEmailTemplatePayload(
      { default_template: { position: 'start', unrelated_field: 'kept' } },
      currentEmailSettings,
      payload,
    );

    expect(result).toEqual({
      admin_emails: currentEmailSettings.admin_emails,
      customer_emails: currentEmailSettings.customer_emails,
      mail_configuration: currentEmailSettings.mail_configuration,
      default_template: { ...payload, unrelated_field: 'kept' },
    });
  });

  it('treats a missing default_template as empty', () => {
    const result = buildEmailTemplatePayload({}, currentEmailSettings, payload);

    expect(result.default_template).toEqual(payload);
  });
});
