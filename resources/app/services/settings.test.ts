import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { isApiValidationError } from '@/schemas/shared/errors';
import { getSettings } from '@/services/settings';
import { server } from '@/tests/msw/server';

const url = (key: string) => `${window.kirki_ecommerce.rest_url_base}${endpoints.SETTINGS_BY_KEY(key)}`;

describe('getSettings("email") against a documented-divergent payload', () => {
  it('parses a populated notification group keyed by notification name', async () => {
    server.use(
      http.get(url('email'), () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: {
            admin_emails: {
              order_notifications: { order_placed: { name: 'Order placed', is_enabled: true } },
            },
          },
        }),
      ),
    );

    const result = await getSettings('email');

    expect(result.admin_emails?.order_notifications).toEqual({
      order_placed: { name: 'Order placed', is_enabled: true },
    });
  });

  /**
   * PHP serialises an empty associative array as `[]`, not `{}`. There is
   * currently no normalization for this direction (unlike the
   * keyed-object-as-list case `unwrapDataList`/`normalizeProviderCollection`
   * cover) — `EmailNotificationGroupSchema` is a bare `z.record(...)`, which
   * rejects an array outright. This test documents that current behavior:
   * the request fails validation rather than crashing on property access,
   * but it is a reported failure, not a handled shape.
   */
  it('reports a validation error, not a property-access crash, when an empty group arrives as []', async () => {
    server.use(
      http.get(url('email'), () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: {
            admin_emails: {
              order_notifications: [],
            },
          },
        }),
      ),
    );

    await expect(getSettings('email')).rejects.toSatisfy((error: unknown) => isApiValidationError(error));
  });
});
