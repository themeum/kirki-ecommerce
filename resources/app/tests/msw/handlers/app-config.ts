import { http, HttpResponse } from 'msw';

const APP_CONFIG_ENDPOINT = 'https://example.test/wp-json/kirki/ecommerce/v1/app-config';

/**
 * A deliberately non-USD base currency: any test that still renders a dollar
 * sign is reading a hardcoded symbol rather than the store's own.
 */
const appConfigResponse = {
  name: 'Kirki Ecommerce',
  version: '1.0.0',
  base_currency: { id: 1, code: 'EUR', name: 'Euro', symbol: '€' },
};

export const handlers = [
  http.get(APP_CONFIG_ENDPOINT, () => {
    return HttpResponse.json({ data: appConfigResponse });
  }),
];

export { APP_CONFIG_ENDPOINT, appConfigResponse };
