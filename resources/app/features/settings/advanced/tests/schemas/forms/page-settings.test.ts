import { describe, expect, it } from 'vitest';

import { AdvanceSettingsFormSchema } from '@/features/settings/advanced/schemas/forms/page-settings';
import type { AdvanceSettingsPage } from '@/schemas/catalog/settings';

const page = (
  overrides: Partial<AdvanceSettingsPage> & Pick<AdvanceSettingsPage, 'key'>,
): AdvanceSettingsPage => ({
  id: 10,
  name: 'Shop',
  title: 'Storefront',
  slug: 'shop',
  url: 'https://example.test/shop',
  status: 'active',
  ...overrides,
});

describe('AdvanceSettingsFormSchema', () => {
  it('folds the pages array into a key -> id map', () => {
    const result = AdvanceSettingsFormSchema.parse({
      pages: [page({ key: 'shop', id: 12 }), page({ key: 'cart', id: 15 })],
    });

    expect(result.pages).toEqual({ shop: 12, cart: 15 });
  });

  it('drops slots with no assigned page', () => {
    const result = AdvanceSettingsFormSchema.parse({
      pages: [
        page({ key: 'shop', id: 12 }),
        page({ key: 'checkout', id: null, status: 'not-found' }),
      ],
    });

    expect(result.pages).toEqual({ shop: 12 });
  });

  it('defaults to an empty map', () => {
    expect(AdvanceSettingsFormSchema.parse({}).pages).toEqual({});
  });
});
