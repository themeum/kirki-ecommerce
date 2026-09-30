import { describe, expect, it } from 'vitest';

import { EmailSettingsSchema } from '@/schemas/catalog/settings';

describe('EmailSettingsSchema default_template', () => {
  it('keeps the hydrated logo media object from the settings response', () => {
    const logo = { id: '5', url: 'https://x/logo.png' };

    const result = EmailSettingsSchema.parse({
      default_template: {
        logo,
        colors: { background: {}, typography: {}, button: {} },
      },
    });

    expect(result.default_template.logo).toEqual(logo);
  });
});
