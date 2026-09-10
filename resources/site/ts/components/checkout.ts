/**
 * Alpine component: checkout
 * Handles checkout form interactions and order submission.
 *
 * PHP usage:
 *   <div x-data="checkout({
 *     cartTotal: <?= $cart->total ?>,
 *     currency: '<?= $currency ?>'
 *   })">
 */

import { buildCartApi } from '../api/cart';
import { checkoutApi } from '../api/checkout';
import { emit, EVENTS, listen, waitForEvent } from '../events';
import { toastManager } from '../services/toast/runtime';
import type { CheckoutRequest, ShippingMethod } from '../types';
import { config } from '../utils';
import { debounce } from '../utils/debounce';
import { scrollToFirstError } from '../utils/dom';
import { renderPaymentGatewayHTML } from '../utils/payment';
import { type CountryState, createAddressModal } from './address-modal';
import {
  type CheckoutAddress,
  formatAddressPayload,
  getStatesForCountry,
  initAddress,
  toBillingOrderFields,
  toShippingOrderFields,
  validateAddress,
} from './checkout-address';

const cartApi = buildCartApi({ skipTax: false });

export type { CheckoutAddress };
export { stateField } from './state-field';

/** Subset of Alpine $data() returned for the form component */
type AlpineFormData = {
  values: Record<string, string>;
  setError: (field: string, message: string) => void;
  clearErrors: () => void;
};

/** Alpine magic properties available inside x-data component objects */
type AlpineContext = {
  $el: HTMLElement;
  $dispatch: (event: string, detail?: unknown) => void;
  $nextTick: (callback: () => void) => void;
};

export type CheckoutConfig = {
  cartTotal?: number;
};

export function checkout(componentConfig: CheckoutConfig = {}) {
  const { __ } = window.wp.i18n;

  const rawSavedAddresses = config.addresses ?? [];
  const initialCartData = config.checkout_cart ?? null;
  const defaultCountry = config.countries?.[0]?.code || '';

  const defaultShippingSaved =
    rawSavedAddresses.find((savedAddress: any) => savedAddress.is_default_shipping) ??
    rawSavedAddresses[0];
  const defaultBillingSaved =
    rawSavedAddresses.find((savedAddress: any) => savedAddress.is_default_billing) ??
    rawSavedAddresses[0];

  const initialShipping = (() => {
    const cartAddress = initialCartData?.shipping_address;
    if (cartAddress && Object.keys(cartAddress).length) {
      if (cartAddress.id) {
        return cartAddress;
      }
      const matched =
        rawSavedAddresses.find(
          (savedAddress: any) =>
            savedAddress.address_line1 &&
            savedAddress.address_line1 === cartAddress.address_line1 &&
            savedAddress.city === cartAddress.city,
        ) ?? defaultShippingSaved;
      return { ...cartAddress, id: matched?.id ?? null };
    }
    return defaultShippingSaved ?? {};
  })();

  const initialBilling = (() => {
    const cartAddress = initialCartData?.billing_address;
    if (cartAddress && Object.keys(cartAddress).length) {
      if (cartAddress.id) {
        return cartAddress;
      }
      const matched =
        rawSavedAddresses.find(
          (savedAddress: any) =>
            savedAddress.address_line1 &&
            savedAddress.address_line1 === cartAddress.address_line1 &&
            savedAddress.city === cartAddress.city,
        ) ?? defaultBillingSaved;
      return { ...cartAddress, id: matched?.id ?? null };
    }
    return defaultBillingSaved ?? {};
  })();

  return {
    cartTotal: componentConfig.cartTotal ?? 0,
    currency: config.currency ?? 'USD',
    cartData: initialCartData,
    countries: config.countries ?? [],

    // ── Unified Address State ─────────────────────────────────────────────
    shippingAddress: initAddress(initialShipping, defaultCountry),
    billingAddress: initAddress(initialBilling, defaultCountry),
    shippingErrors: {} as Record<string, string>,
    billingErrors: {} as Record<string, string>,

    // ── Saved address book ────────────────────────────────────────────────
    savedAddresses: rawSavedAddresses,
    // Temp selection inside the picker modal (uncommitted until "Add" clicked)
    tempSelectedAddressId: null as number | string | null,
    shippingPickerOpen: false,
    billingPickerOpen: false,
    // Which picker is open ('shipping' | 'billing')
    pickerPurpose: 'shipping' as 'shipping' | 'billing',

    // Shared address modal state, helpers, and handlers
    ...createAddressModal({
      onSaved(self, newAddress, isEditing) {
        if (!isEditing) {
          self.tempSelectedAddressId = newAddress.id;
        }
      },
    }),

    get availableStates(): CountryState[] {
      return (this as any).getAvailableStates();
    },

    get shippingStates(): CountryState[] {
      return getStatesForCountry(this.shippingAddress.country, this.countries);
    },

    get billingStates(): CountryState[] {
      return getStatesForCountry(this.billingAddress.country, this.countries);
    },

    get selectedShippingAddress(): CheckoutAddress {
      return this.shippingAddress;
    },

    get selectedBillingAddress(): CheckoutAddress {
      return this.billingAddress;
    },

    get hasSavedAddresses(): boolean {
      return this.savedAddresses.length > 0;
    },

    get showSavedBillingAddress(): boolean {
      return this.savedAddresses.length > 1;
    },

    selectedPaymentMethod: '',
    selectedShippingMethod: '',
    couponCode: '',
    appliedCouponCode: '' as string,
    discount: null as string | null,
    billingSameAsShipping: Boolean(initialCartData?.is_billing_same_as_shipping),

    loading: false,
    couponLoading: false,
    error: null as string | null,

    availableShippingMethods: [] as ShippingMethod[],
    shippingMethodError: null as string | null,

    init() {
      // Pre-select the first payment method
      const firstPaymentRadio = document.querySelector<HTMLInputElement>(
        'input[name="payment_provider"]',
      );
      if (firstPaymentRadio) {
        this.selectedPaymentMethod = firstPaymentRadio.value;
      }

      // Initialize available shipping methods from cart data
      if (this.cartData?.available_shipping_methods) {
        this.availableShippingMethods = this.cartData.available_shipping_methods;
        if (this.cartData.shipping_method) {
          // shipping_method from the cart is an object; extract the id for radio binding
          this.selectedShippingMethod =
            this.cartData.shipping_method?.id ?? this.cartData.shipping_method;
        } else if (this.availableShippingMethods.length > 0) {
          // Select first shipping method if none selected
          this.selectedShippingMethod = this.availableShippingMethods[0].id;

          (this as unknown as AlpineContext).$nextTick(() => {
            void this.updateCart();
          });
        }
      }

      // Initialize discount state from cart data
      if (this.cartData?.pricing?.discount_details) {
        this.discount = this.cartData.pricing.display_discount_total_money_object.display || null;
        this.appliedCouponCode = this.cartData.pricing.discount_details?.code ?? '';
      }

      // Debounced cart update — prevents hammering the API on rapid field changes
      const debouncedUpdateCart = debounce(() => this.updateCart(), 400);

      listen(EVENTS.ADDRESS_CHANGED, () => debouncedUpdateCart());
    },

    // ── Address State Setters & Helpers ───────────────────────────────────

    setShippingAddress(address: Partial<CheckoutAddress>) {
      this.shippingAddress = initAddress(address, this.shippingAddress.country);
      this.shippingErrors = {};
    },

    setBillingAddress(address: Partial<CheckoutAddress>) {
      this.billingAddress = initAddress(address, this.billingAddress.country);
      this.billingErrors = {};
    },

    validateShipping(): boolean {
      this.shippingErrors = validateAddress(this.shippingAddress, this.shippingStates);
      return Object.keys(this.shippingErrors).length === 0;
    },

    validateBilling(): boolean {
      this.billingErrors = validateAddress(this.billingAddress, this.billingStates);
      return Object.keys(this.billingErrors).length === 0;
    },

    onShippingCountryChange() {
      this.shippingAddress.state = '';
      delete this.shippingErrors.country;
      delete this.shippingErrors.state;
      void this.updateCart();
    },

    onShippingStateChange() {
      delete this.shippingErrors.state;
      void this.updateCart();
    },

    onBillingCountryChange() {
      this.billingAddress.state = '';
      delete this.billingErrors.country;
      delete this.billingErrors.state;
    },

    onBillingStateChange() {
      delete this.billingErrors.state;
    },

    // ── Address picker modal ──────────────────────────────────────────────

    openShippingPicker() {
      this.pickerPurpose = 'shipping';
      this.tempSelectedAddressId = this.shippingAddress.id ?? null;
      this.shippingPickerOpen = true;
    },

    openBillingPicker() {
      this.pickerPurpose = 'billing';
      this.tempSelectedAddressId = this.billingAddress.id ?? null;
      this.billingPickerOpen = true;
    },

    closeAddressPicker() {
      this.shippingPickerOpen = false;
      this.billingPickerOpen = false;
      this.tempSelectedAddressId = null;
    },

    confirmAddressSelection() {
      const selected = this.savedAddresses.find(
        (savedAddress) => String(savedAddress.id) === String(this.tempSelectedAddressId),
      );
      if (selected) {
        if (this.pickerPurpose === 'shipping') {
          this.setShippingAddress(selected);
          if (this.billingSameAsShipping) {
            this.setBillingAddress(selected);
          }
        } else {
          this.setBillingAddress(selected);
        }
      }
      this.closeAddressPicker();
      void this.updateCart();
    },

    async updateCart() {
      try {
        const cartData = {
          shipping_address: formatAddressPayload(this.shippingAddress),
          is_billing_same_as_shipping: this.billingSameAsShipping,
          shipping_method: this.selectedShippingMethod,
          ...(!this.billingSameAsShipping
            ? { billing_address: formatAddressPayload(this.billingAddress) }
            : {}),
        };

        const response = await cartApi.update(cartData);
        this.cartData = response.data;
        this.availableShippingMethods = response.data.available_shipping_methods || [];

        // Update selected shipping method if it changed
        if (response.data.shipping_method) {
          this.selectedShippingMethod =
            response.data.shipping_method?.id ?? response.data.shipping_method;
        }

        // Keep discount state in sync with the refreshed cart
        if (response.data?.pricing?.discount_details) {
          this.discount =
            response.data.pricing?.display_discount_total_money_object.display || null;
          this.appliedCouponCode = response.data.pricing?.discount_details?.code ?? '';
        }
      } catch (caughtError: unknown) {
        this.handleApiErrors(
          caughtError as Error & { errors?: Record<string, string[]> },
          __('Failed to update cart', 'kirki-ecommerce'),
          (errorMessage) => {
            this.shippingMethodError = errorMessage;
          },
        );
      }
    },

    setShippingMethod(methodId: string) {
      this.selectedShippingMethod = methodId;
      this.shippingMethodError = null;
      (this as unknown as AlpineContext).$dispatch('shipping-method-change', { methodId });
      void this.updateCart();
    },

    async applyCoupon() {
      this.couponLoading = true;
      this.error = null;

      try {
        const response = await cartApi.applyCoupon(this.couponCode);
        this.cartData = response.data;
        this.discount = response.data.pricing.display_discount_total_money_object.display || null;
        this.appliedCouponCode = this.couponCode;
        this.couponCode = '';
        toastManager.success(__('Coupon applied successfully!', 'kirki-ecommerce'));
      } catch (caughtError: unknown) {
        const error =
          caughtError instanceof Error
            ? caughtError.message
            : __('Failed to apply coupon', 'kirki-ecommerce');
        this.error = error;
        toastManager.error(error);
      } finally {
        this.couponLoading = false;
      }
    },

    async removeCoupon() {
      this.couponLoading = true;
      this.error = null;

      try {
        const response = await cartApi.removeCoupon();
        this.cartData = response.data;
        this.couponCode = '';
        this.appliedCouponCode = '';
        this.discount = null;
        toastManager.success(__('Coupon removed successfully!', 'kirki-ecommerce'));
      } catch (caughtError: unknown) {
        const error =
          caughtError instanceof Error
            ? caughtError.message
            : __('Failed to remove coupon', 'kirki-ecommerce');
        this.error = error;
        toastManager.error(error);
      } finally {
        this.couponLoading = false;
      }
    },

    setPaymentMethod(method: string) {
      this.selectedPaymentMethod = method;
      emit(EVENTS.PAYMENT_METHOD_CHANGED, { method });
    },

    async placeOrder() {
      this.error = null;

      try {
        // Validate contact form if present
        const contactFormElement = document.querySelector('#contact-form');
        if (contactFormElement) {
          emit(EVENTS.CONTACT_FORM_VALIDATE);
          const contactResult = await waitForEvent(EVENTS.CONTACT_FORM_VALIDATED);
          if (!contactResult.isValid) {
            scrollToFirstError();
            return;
          }
        }

        // Validate shipping form if inline (no saved addresses)
        if (!this.hasSavedAddresses) {
          if (!this.validateShipping()) {
            scrollToFirstError();
            return;
          }
        }

        // Validate billing form if inline (different from shipping and no 2+ saved addresses)
        if (!this.billingSameAsShipping && !this.showSavedBillingAddress) {
          if (!this.validateBilling()) {
            scrollToFirstError();
            return;
          }
        }

        if (!this.selectedShippingMethod) {
          this.shippingMethodError = __('Please select a shipping method.', 'kirki-ecommerce');
          scrollToFirstError();
          return;
        }

        if (!this.cartData?.items?.length) {
          toastManager.error(__('Your cart is empty', 'kirki-ecommerce'));
          return;
        }

        // Start loading after validation passes
        this.loading = true;

        const contactForm: AlpineFormData | null = contactFormElement
          ? window.Alpine.$data(contactFormElement)
          : null;
        const customerEmail = contactForm
          ? String(contactForm.values.customer_email || '').trim()
          : (config.current_user?.email ?? '');

        const shippingFields = toShippingOrderFields(this.shippingAddress);
        const billingFields = !this.billingSameAsShipping
          ? toBillingOrderFields(this.billingAddress)
          : {};

        const customerPhone = this.shippingAddress.phone || '';

        // Prepare order data
        const orderData: CheckoutRequest = {
          items: (this.cartData?.items ?? []).map((item) => ({
            variant_id: item.product.variant_id,
            quantity: item.quantity,
          })),
          currency_code: this.currency,
          payment_provider: this.selectedPaymentMethod,
          coupon_code: this.appliedCouponCode || undefined,
          shipping_method: this.selectedShippingMethod || undefined,
          is_billing_same_as_shipping: this.billingSameAsShipping,
          ...shippingFields,
          ...billingFields,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_notes: null,
        };

        // Create order
        const { data } = await checkoutApi.create(orderData);
        toastManager.success(__('Order placed successfully!', 'kirki-ecommerce'));

        if (data.payment_next_step) {
          const { type, value } = data.payment_next_step;
          if (type === 'redirect') {
            window.location.href = value;
          } else if (type === 'html') {
            await renderPaymentGatewayHTML(value);
          }
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('order', 'success');
          url.searchParams.set('uuid', data.uuid);
          window.location.href = url.toString();
        }
      } catch (caughtError: unknown) {
        const apiError = caughtError as Error & { errors?: Record<string, string[]> };
        this.error = apiError.message ?? __('Checkout failed', 'kirki-ecommerce');
        this.handleApiErrors(apiError, __('Checkout failed', 'kirki-ecommerce'), (errorMessage) => {
          this.shippingMethodError = errorMessage;
        });
      } finally {
        this.loading = false;
      }
    },

    handleApiErrors(
      apiError: Error & { errors?: Record<string, string[]> },
      fallbackMessage: string,
      onShippingMethodError?: (errorMessage: string) => void,
    ) {
      if (!apiError.errors) {
        toastManager.error(apiError.message ?? fallbackMessage);
        return;
      }

      const contactFormElement = document.querySelector('#contact-form');
      const contactForm: AlpineFormData | null = contactFormElement
        ? window.Alpine.$data(contactFormElement)
        : null;

      let hasFieldErrors = false;

      for (const [key, messages] of Object.entries(apiError.errors)) {
        const rawMessage = messages[0];
        if (key === 'customer_email' || key === 'email') {
          contactForm?.setError('customer_email', rawMessage);
          hasFieldErrors = true;
        } else if (key === 'shipping_method') {
          onShippingMethodError?.(rawMessage);
          hasFieldErrors = true;
        } else if (key.startsWith('shipping_')) {
          const field = key.replace('shipping_', '');
          this.shippingErrors[field] = rawMessage;
          hasFieldErrors = true;
        } else if (key.startsWith('billing_')) {
          const field = key.replace('billing_', '');
          this.billingErrors[field] = rawMessage;
          hasFieldErrors = true;
        }
      }

      if (!hasFieldErrors) {
        const firstError = Object.values(apiError.errors).flat()[0];
        toastManager.error(firstError ?? fallbackMessage);
      } else {
        scrollToFirstError();
      }
    },
  };
}
