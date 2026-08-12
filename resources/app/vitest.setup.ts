// Form/payload tests run in a plain Node environment (no DOM needed), but
// several modules read `window.wp.i18n` / `window.kirki_ecommerce` at import
// time. Stub them so those imports don't throw outside a browser.
(globalThis as { window?: unknown }).window ??= {};
(window as { kirki_ecommerce?: Record<string, unknown> }).kirki_ecommerce ??= {};
