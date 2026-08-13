import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import { getOnlinePayments } from '@/features/settings/payment/services/payment';
import { server } from '@/tests/msw/server';

const url = `${window.kirki_ecommerce.rest_url_base}${endpoints.ONLINE_PAYMENTS}`;

describe('getOnlinePayments against a gateway map keyed by provider id', () => {
  /**
   * The recorded pre-existing crash path: `GET /online-payments` returns a
   * PHP associative array keyed by provider id (`{"stripe": {...}}`)
   * instead of a JSON array, because PHP drops non-sequential/string keys
   * when json_encode-ing what the frontend expects as a list. Before
   * `OnlinePaymentListSchema`'s `normalizeProviderCollection` preprocessing
   * existed, this made the payments settings page unreachable.
   */
  it('normalizes a keyed gateway map into a list, preserving each provider\'s fields', async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: {
            stripe: { id: 'stripe', name: 'Stripe', is_enabled: true, is_offline: false },
            paypal: { id: 'paypal', name: 'PayPal', is_enabled: false, is_offline: false },
          },
        }),
      ),
    );

    const result = await getOnlinePayments();

    expect(result).toEqual([
      { id: 'stripe', name: 'Stripe', is_enabled: true, is_offline: false },
      { id: 'paypal', name: 'PayPal', is_enabled: false, is_offline: false },
    ]);
  });

  it('leaves an already-array response unchanged', async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: [{ id: 'stripe', name: 'Stripe', is_enabled: true, is_offline: false }],
        }),
      ),
    );

    const result = await getOnlinePayments();

    expect(result).toEqual([{ id: 'stripe', name: 'Stripe', is_enabled: true, is_offline: false }]);
  });

  it('resolves an empty gateway map (PHP\'s empty associative array) to an empty list', async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({ success: true, message: '', data: [] }),
      ),
    );

    expect(await getOnlinePayments()).toEqual([]);
  });
});
