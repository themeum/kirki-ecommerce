/**
 * Custom event registry for the site bundle.
 *
 * All custom events dispatched or listened to across components are defined here.
 * Event names follow the pattern `kecom:namespace:verb` to avoid collisions with
 * other WordPress plugins or browser-native events.
 *
 * Use the typed `emit` and `listen` helpers instead of raw `dispatchEvent` /
 * `addEventListener` calls so that event names and detail shapes stay in sync.
 */

import type { Variant } from './components/variant-selector';

// ── Event detail shapes ───────────────────────────────────────────────────────

export type Events = {
  /** Fired when the selected product variant changes. */
  'kecom:variant:changed': { variant: Variant };

  /** Fired when any shipping/billing address field changes (debounced). */
  'kecom:address:changed': void;

  /** Fired by quantitySelector on every quantity change. */
  'kecom:quantity:changed': { quantity: number };

  /** Fired when the user selects a different shipping method. */
  'kecom:shipping-method:changed': { methodId: string };

  /** Fired when the user selects a different payment method. */
  'kecom:payment-method:changed': { method: string };

  /** Trigger the shipping form to run its validation. */
  'kecom:shipping-form:validate': void;

  /** Trigger the billing form to run its validation. */
  'kecom:billing-form:validate': void;

  /** Fired by the shipping form after validation completes. */
  'kecom:shipping-form:validated': { isValid: boolean };

  /** Fired by the billing form after validation completes. */
  'kecom:billing-form:validated': { isValid: boolean };

  /** Fired when the modal opens. */
  'kecom:modal:opened': void;

  /** Fired when the modal closes. */
  'kecom:modal:closed': void;

  /** Fired when the active tab changes. */
  'kecom:tab:changed': { tabId: string };

  /** Fired when the shop product list is refreshed. */
  'kecom:shop:products-updated': {
    products_html?: string;
    pagination_html?: string;
    filters?: unknown;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Dispatch a typed custom event on `window`.
 *
 * @example
 *   emit("kecom:variant:changed", { variant });
 *   emit("kecom:address:changed");
 */
export function emit<K extends keyof Events>(
  name: K,
  ...args: Events[K] extends void ? [] : [detail: Events[K]]
): void {
  const detail = args[0];
  window.dispatchEvent(new CustomEvent(name, detail !== undefined ? { detail } : undefined));
}

/**
 * Add a typed `window` event listener. Returns an unsubscribe function.
 *
 * @example
 *   const off = listen("kecom:variant:changed", ({ variant }) => { ... });
 *   // later:
 *   off();
 */
export function listen<K extends keyof Events>(
  name: K,
  handler: Events[K] extends void ? () => void : (detail: Events[K]) => void,
  options?: AddEventListenerOptions,
): () => void {
  const listener = (e: Event) => {
    (handler as (detail: unknown) => void)((e as CustomEvent).detail);
  };
  window.addEventListener(name, listener, options);
  return () => window.removeEventListener(name, listener);
}
