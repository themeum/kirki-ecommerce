// Form/payload tests run in a plain Node environment (no DOM needed), but
// several modules read `window.wp.i18n` / `window.kirki_ecommerce` at import
// time. Stub them so those imports don't throw outside a browser.
(globalThis as { window?: unknown }).window ??= {};

// `rest_url_base` must be a real absolute URL — MSW-backed service-layer
// tests run in this project too, and axios needs a valid baseURL to build
// a request even before MSW gets a chance to intercept it.
(window as { kirki_ecommerce?: Record<string, unknown> }).kirki_ecommerce ??= {
  site_url: 'https://example.test',
  rest_url_base: 'https://example.test/wp-json/kirki/ecommerce/v1',
  rest_nonce: 'test-nonce',
  version: 'test',
  is_dev: true,
};
