import { describe, expect, it } from 'vitest';

import { EmailTemplateFormSchema } from '@/features/settings/email/schemas/forms/email-template-form';

describe('EmailTemplateFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: { id: 5, url: 'https://x/logo.png' },
      height: 75,
      position: 'center',
      colors: {
        background: {
          email_body: '#fff',
          outer_area: '#eee',
          info_cards: '#ddd',
          divider: '#ccc',
        },
        typography: {
          headings: '#000',
          body: '#111',
          muted: '#222',
          link: '#00f',
          exceptions: '#f00',
        },
        button: {
          background: '#0a0',
          text: '#fff',
        },
      },
      additional_description: '<p>Hello</p>',
      footer: '<p>Bye</p>',
    });

    expect(result.logo).toBe(5);
    expect(result.height).toBe(75);
    expect(result.position).toBe('center');
    expect(result.colors.background.email_body).toBe('#fff');
    expect(result.colors.typography.headings).toBe('#000');
    expect(result.colors.button.background).toBe('#0a0');
    expect(result.additional_description).toBe('<p>Hello</p>');
    expect(result.footer).toBe('<p>Bye</p>');
  });

  it('defaults the height to 50 and the position to center when blank', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: null,
      height: null,
      position: '',
      colors: { background: {}, typography: {}, button: {} },
    });
    expect(result.height).toBe(50);
    expect(result.position).toBe('center');
  });

  it('extracts the id from a media object logo', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: { id: 5, url: 'https://x/media.png' },
      height: 50,
      position: 'start',
      colors: { background: {}, typography: {}, button: {} },
    });
    expect(result.logo).toBe(5);
  });

  it('sends null for a missing logo and blank content fields, and falls back color fields to the mockup defaults', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: null,
      height: 50,
      position: 'start',
      colors: { background: {}, typography: {}, button: {} },
    });
    expect(result.logo).toBeNull();
    expect(result.colors.background.email_body).toBe('#FFFFFF');
    expect(result.colors.typography.exceptions).toBe('#0078CE');
    expect(result.colors.button.text).toBe('#FFFFFF');
    expect(result.additional_description).toBeNull();
    expect(result.footer).toBeNull();
  });
});
