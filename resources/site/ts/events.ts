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

export const EVENTS = {
  /** Fired when the selected product variant changes. */
  VARIANT_CHANGED: 'kecom:variant:changed',

  /** Fired when any shipping/billing address field changes (debounced). */
  ADDRESS_CHANGED: 'kecom:address:changed',

  /** Fired by quantitySelector on every quantity change. */
  QUANTITY_CHANGED: 'kecom:quantity:changed',

  /** Fired when the user selects a different shipping method. */
  SHIPPING_METHOD_CHANGED: 'kecom:shipping-method:changed',

  /** Fired when the user selects a different payment method. */
  PAYMENT_METHOD_CHANGED: 'kecom:payment-method:changed',

  /** Trigger the shipping form to run its validation. */
  SHIPPING_FORM_VALIDATE: 'kecom:shipping-form:validate',

  /** Trigger the billing form to run its validation. */
  BILLING_FORM_VALIDATE: 'kecom:billing-form:validate',

  /** Fired by the shipping form after validation completes. */
  SHIPPING_FORM_VALIDATED: 'kecom:shipping-form:validated',

  /** Fired by the billing form after validation completes. */
  BILLING_FORM_VALIDATED: 'kecom:billing-form:validated',

  /** Fired when the modal opens. */
  MODAL_OPENED: 'kecom:modal:opened',

  /** Fired when the modal closes. */
  MODAL_CLOSED: 'kecom:modal:closed',

  /** Fired when the active tab changes. */
  TAB_CHANGED: 'kecom:tab:changed',

  /** Fired when the shop product list is refreshed. */
  SHOP_PRODUCTS_UPDATED: 'kecom:shop:products-updated',
} as const;

export type Events = {
  /** Fired when the selected product variant changes. */
  [EVENTS.VARIANT_CHANGED]: { variant: Variant };

  /** Fired when any shipping/billing address field changes (debounced). */
  [EVENTS.ADDRESS_CHANGED]: void;

  /** Fired by quantitySelector on every quantity change. */
  [EVENTS.QUANTITY_CHANGED]: { quantity: number };

  /** Fired when the user selects a different shipping method. */
  [EVENTS.SHIPPING_METHOD_CHANGED]: { methodId: string };

  /** Fired when the user selects a different payment method. */
  [EVENTS.PAYMENT_METHOD_CHANGED]: { method: string };

  /** Trigger the shipping form to run its validation. */
  [EVENTS.SHIPPING_FORM_VALIDATE]: void;

  /** Trigger the billing form to run its validation. */
  [EVENTS.BILLING_FORM_VALIDATE]: void;

  /** Fired by the shipping form after validation completes. */
  [EVENTS.SHIPPING_FORM_VALIDATED]: { isValid: boolean };

  /** Fired by the billing form after validation completes. */
  [EVENTS.BILLING_FORM_VALIDATED]: { isValid: boolean };

  /** Fired when the modal opens. */
  [EVENTS.MODAL_OPENED]: void;

  /** Fired when the modal closes. */
  [EVENTS.MODAL_CLOSED]: void;

  /** Fired when the active tab changes. */
  [EVENTS.TAB_CHANGED]: { tabId: string };

  /** Fired when the shop product list is refreshed. */
  [EVENTS.SHOP_PRODUCTS_UPDATED]: {
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
