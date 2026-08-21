import '@testing-library/jest-dom/vitest';

// Component/hook tests run under jsdom, where `window` already exists, so
// `vitest.setup.ts`'s `globalThis.window ??= {}` guard is a no-op and
// `window.wp.i18n` / `window.kirki_ecommerce` stay unset. Modules read them
// at import time (see conf.ts, libs/api.ts, wpi18n.ts), so they must be
// populated explicitly here rather than relying on that guard.
window.kirki_ecommerce = {
  site_url: 'https://example.test',
  rest_url_base: 'https://example.test/wp-json/kirki/ecommerce/v1',
  rest_nonce: 'test-nonce',
  version: 'test',
  is_dev: true,
};

window.wp = {
  i18n: {
    __: (text) => text,
    _x: (text) => text,
    _n: (single, plural, number) => (number === 1 ? single : plural),
    _nx: (single, plural, number) => (number === 1 ? single : plural),
    sprintf: (format, ...args) =>
      args.reduce<string>(
        (result, arg) => result.replace('%s', String(arg)),
        format,
      ),
    setLocaleData: () => undefined,
    getLocaleData: () => ({}),
  },
};

// cmdk (behind Combobox/Command) observes and scrolls its list on mount, and
// jsdom implements neither API. Stubs are enough because nothing here depends
// on real layout.
globalThis.ResizeObserver = class {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
};

Element.prototype.scrollIntoView = () => undefined;
