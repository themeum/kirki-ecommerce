import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import type { PaymentMethod } from '@/features/settings/payment/schemas/catalog/payment';
import {
  getOnlinePayments,
  getPaymentMethods,
  reorderPaymentMethods,
  setEnabledOfflinePayment,
} from '@/features/settings/payment/services/payment';
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

describe('getPaymentMethods', () => {
  const methodsUrl = `${window.kirki_ecommerce.rest_url_base}${endpoints.PAYMENT_METHODS}`;

  it('returns offline and online methods in one list', async () => {
    server.use(
      http.get(methodsUrl, () =>
        HttpResponse.json({
          success: true,
          message: '',
          data: [
            { id: 'cod', name: 'Cash on Delivery', is_enabled: true, is_offline: true, icon_media: null },
            { id: 'paypal', name: 'PayPal', is_enabled: false, is_offline: false, icon_media: null },
          ],
        }),
      ),
    );

    const result = await getPaymentMethods();

    expect(result.map((method) => [method.id, method.is_offline])).toEqual([
      ['cod', true],
      ['paypal', false],
    ]);
  });

  it('resolves an empty list', async () => {
    server.use(
      http.get(methodsUrl, () => HttpResponse.json({ success: true, message: '', data: [] })),
    );

    expect(await getPaymentMethods()).toEqual([]);
  });
});

describe('setEnabledOfflinePayment', () => {
  const offlineUrl = (id: string) =>
    `${window.kirki_ecommerce.rest_url_base}${endpoints.OFFLINE_PAYMENT(id)}`;

  it('patches only is_enabled to the offline payment endpoint', async () => {
    let received: unknown = null;

    server.use(
      http.patch(offlineUrl('cod'), async ({ request }) => {
        received = await request.json();

        return HttpResponse.json({ success: true, message: 'Payment method updated', data: true });
      }),
    );

    const result = await setEnabledOfflinePayment({ id: 'cod', data: { is_enabled: false } });

    expect(received).toEqual({ is_enabled: false });
    expect(result.data).toBe(true);
  });
});

describe('reorderPaymentMethods', () => {
  const orderUrl = `${window.kirki_ecommerce.rest_url_base}${endpoints.PAYMENT_METHODS_ORDER}`;
  const methods: PaymentMethod[] = [
    { id: 'cod', name: 'Cash on Delivery', is_enabled: true, is_offline: true, icon_media: null },
    { id: 'bank', name: 'Bank Transfer', is_enabled: true, is_offline: true, icon_media: null },
    { id: 'paypal', name: 'PayPal', is_enabled: false, is_offline: false, icon_media: null },
  ];

  it('puts the full id list to the order endpoint and returns the ordered methods', async () => {
    let received: unknown = null;

    server.use(
      http.put(orderUrl, async ({ request }) => {
        received = await request.json();

        return HttpResponse.json({
          success: true,
          message: 'Payment methods reordered.',
          data: [methods[2], methods[0], methods[1]],
        });
      }),
    );

    const result = await reorderPaymentMethods(['paypal', 'cod', 'bank']);

    expect(received).toEqual({ ids: ['paypal', 'cod', 'bank'] });
    expect(result.data.map((method) => method.id)).toEqual(['paypal', 'cod', 'bank']);
  });
});
