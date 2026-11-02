// Storefront modules read `window.wp.i18n` and `window.kirki_ecommerce` at
// import time or inside exported functions. Stub them so tests run in a plain
// Node environment without a browser.
(globalThis as { window?: unknown }).window ??= {};

(window as { wp?: Record<string, unknown> }).wp ??= {
  i18n: {
    __: (text: string) => text,
    _x: (text: string) => text,
    _n: (single: string, plural: string, number: number) =>
      number === 1 ? single : plural,
    sprintf: (format: string, ...args: unknown[]) =>
      args.reduce<string>((carry, arg) => carry.replace('%s', String(arg)), format),
  },
};

(window as { kirki_ecommerce?: Record<string, unknown> }).kirki_ecommerce ??= {
  site_url: 'https://example.test',
  rest_url_base: 'https://example.test/wp-json/kirki/ecommerce/v1',
  rest_nonce: 'test-nonce',
  version: 'test',
  is_dev: true,
};
