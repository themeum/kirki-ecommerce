import { describe, expect, it } from 'vitest';

import { EmailTemplateFormSchema } from '@/schemas/forms/email-template-form';

describe('EmailTemplateFormSchema', () => {
  it('produces the exact payload for a fully filled form', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: 'https://x/logo.png',
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

    expect(result.logo).toBe('https://x/logo.png');
    expect(result.height).toBe('75px');
    expect(result.position).toBe('center');
    expect(result.colors.background).toBe('#fff');
  });

  it('suffixes height with px and defaults to 50 when blank', () => {
    const result = EmailTemplateFormSchema.parse({ logo: '', height: null, position: '', colors: {} });
    expect(result.height).toBe('50px');
  });

  it('extracts the url from a media object logo', () => {
    const result = EmailTemplateFormSchema.parse({
      logo: { id: 5, url: 'https://x/media.png' },
      height: 50,
      position: 'start',
      colors: {},
    });
    expect(result.logo).toBe('https://x/media.png');
  });

  it('sends null for blank color fields', () => {
    const result = EmailTemplateFormSchema.parse({ logo: '', height: 50, position: 'start', colors: {} });
    expect(result.colors.background).toBeNull();
  });
});
