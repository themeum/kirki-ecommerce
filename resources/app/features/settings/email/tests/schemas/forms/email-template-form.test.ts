import { describe, expect, it } from 'vitest';

import { EmailTemplateFormSchema } from '@/features/settings/email/schemas/forms/email-template-form';

describe('EmailTemplateFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: { id: 5, url: 'https://x/logo.png' },
      height: 75,
      position: 'center',
      colors: {
        background: '#fff',
        text: '#000',
        link: '#00f',
        label: '#333',
        button: '#0a0',
        button_bg: '#eee',
      },
    });

    expect(result.logo).toBe(5);
    expect(result.height).toBe(75);
    expect(result.position).toBe('center');
    expect(result.colors.background).toBe('#fff');
  });

  it('defaults the height to 50 and the position to center when blank', () => {
    const result = EmailTemplateFormSchema.parse({ logo: null, height: null, position: '', colors: {} });
    expect(result.height).toBe(50);
    expect(result.position).toBe('center');
  });

  it('extracts the id from a media object logo', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: { id: 5, url: 'https://x/media.png' },
      height: 50,
      position: 'start',
      colors: {},
    });
    expect(result.logo).toBe(5);
  });

  it('sends null for a missing logo and for blank color fields', () => {
    const result = EmailTemplateFormSchema.parse({ logo: null, height: 50, position: 'start', colors: {} });
    expect(result.logo).toBeNull();
    expect(result.colors.background).toBeNull();
  });
});
