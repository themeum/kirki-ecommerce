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

const cartApi = buildCartApi({ skipTax: false });
import { checkoutApi } from '../api/checkout';
import { listen } from '../events';
import { toastManager } from '../services/toast/runtime';
import type { CheckoutRequest, ShippingMethod } from '../types';
import { config } from '../utils';

/** Detail shape emitted by *-form-validated custom events */
type FormValidatedDetail = {
  isValid: boolean;
}

/** Subset of Alpine $data() returned for the form component */
type AlpineFormData = {
  values: Record<string, string>;
  setError: (field: string, message: string) => void;
  clearErrors: () => void;
}

/** Alpine magic properties available inside x-data component objects */
type AlpineContext = {
  $el: HTMLElement;
  $dispatch: (event: string, detail?: unknown) => void;
}

export type CheckoutConfig = {
  cartTotal?: number;
}

export type Country = {
  code: string;
  name: string;
  states: {
    id: string;
    name: string;
  }[];
}

export function checkout(componentConfig: CheckoutConfig = {}) {
  const { __ } = window.wp.i18n;

  // Debounce helper — cancels previous call if invoked again within `delay` ms
  function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // Wait for a one-shot window event, resolving with its detail
  function waitForEvent(eventName: string, timeoutMs = 2000): Promise<FormValidatedDetail> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener(eventName, handler);
        reject(new Error(`Timed out waiting for ${eventName}`));
      }, timeoutMs);

      const handler = (e: Event) => {
        clearTimeout(timer);
        window.removeEventListener(eventName, handler);
        resolve((e as CustomEvent).detail);
      };

      window.addEventListener(eventName, handler, { once: true });
    });
  }

  // Scroll to the first field with an active error state.
  // Uses .kecom-field-error-state which is set by fieldWrapper() — more reliable
  // than querying x-show spans whose display style may not yet be updated.
  function scrollToFirstError() {
    requestAnimationFrame(() => {
      const firstErrorField = document.querySelector<HTMLElement>('.kecom-field-error-state');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  // Map API field names to human-readable labels for error messages
  const fieldLabels: Record<string, string> = {
    first_name: __('First name', 'kirki-ecommerce'),
    last_name: __('Last name', 'kirki-ecommerce'),
    email: __('Email address', 'kirki-ecommerce'),
    phone: __('Phone number', 'kirki-ecommerce'),
    address_line1: __('Address', 'kirki-ecommerce'),
    address_line2: __('Apartment / suite', 'kirki-ecommerce'),
    city: __('City', 'kirki-ecommerce'),
    state: __('State', 'kirki-ecommerce'),
    postal_code: __('Postal code', 'kirki-ecommerce'),
    country: __('Country', 'kirki-ecommerce'),
  };

  // Produce a clean user-facing message from an API validation error message
  // by replacing the raw "address_type.field_name" token with a readable label.
  function humanizeFieldError(rawMessage: string, fieldName: string): string {
    const label = fieldLabels[fieldName] ?? fieldName.replace(/_/g, ' ');
    // Replace patterns like "The shipping_address.email field" or
    // "The billing_address.first_name field" with the clean label
    return rawMessage.replace(/shipping_address\.\w+/g, label).replace(/billing_address\.\w+/g, label);
  }

  // Keys follow "shipping_address.field" / "billing_address.field" patterns.
  function handleApiErrors(err: Error & { errors?: Record<string, string[]> }, fallbackMessage: string) {
    if (!err.errors) {
      toastManager.error(err.message ?? fallbackMessage);
      return;
    }

    const shippingFormEl = document.querySelector('#shipping-form');
    const billingFormEl = document.querySelector('#billing-form');
    const shippingForm: AlpineFormData | null = shippingFormEl ? window.Alpine.$data(shippingFormEl) : null;
    const billingForm: AlpineFormData | null = billingFormEl ? window.Alpine.$data(billingFormEl) : null;

    let hasFieldErrors = false;

    for (const [key, messages] of Object.entries(err.errors)) {
      const rawMessage = messages[0];
      if (key.startsWith('shipping_address.')) {
        const field = key.replace('shipping_address.', '');
        shippingForm?.setError(field, humanizeFieldError(rawMessage, field));
        hasFieldErrors = true;
      } else if (key.startsWith('billing_address.')) {
        const field = key.replace('billing_address.', '');
        billingForm?.setError(field, humanizeFieldError(rawMessage, field));
        hasFieldErrors = true;
      }
    }

    if (!hasFieldErrors) {
      const firstError = Object.values(err.errors).flat()[0];
      toastManager.error(firstError ?? fallbackMessage);
    } else {
      scrollToFirstError();
    }
  }

  return {
    cartTotal: componentConfig.cartTotal ?? 0,
    currency: config.currency ?? 'USD',
    cartData: config.checkout_cart ?? null,
    countries: config.countries ?? [],

    selectedPaymentMethod: '',
    selectedShippingMethod: '',
    couponCode: '',
    appliedCouponCode: '' as string,
    discount: null as string | null,
    billingFormValid: false,
    shippingFormValid: false,
    billingSameAsShipping: true,

    loading: false,
    couponLoading: false,
    error: null as string | null,
    success: false,

    availableShippingMethods: [] as ShippingMethod[],

    init() {
      (this as unknown as AlpineContext).$el.addEventListener('kecom:billing-form:validated', (e: Event) => {
        this.billingFormValid = (e as CustomEvent<FormValidatedDetail>).detail.isValid;
      });
      (this as unknown as AlpineContext).$el.addEventListener('kecom:shipping-form:validated', (e: Event) => {
        this.shippingFormValid = (e as CustomEvent<FormValidatedDetail>).detail.isValid;
      });

      // Pre-select the first payment method
      const firstPaymentRadio = document.querySelector<HTMLInputElement>('input[name="payment_provider"]');
      if (firstPaymentRadio) {
        this.selectedPaymentMethod = firstPaymentRadio.value;
      }

      // Initialize available shipping methods from cart data
      if (this.cartData?.available_shipping_methods) {
        this.availableShippingMethods = this.cartData.available_shipping_methods;
        if (this.cartData.shipping_method) {
          // shipping_method from the cart is an object; extract the id for radio binding
          this.selectedShippingMethod = this.cartData.shipping_method?.id ?? this.cartData.shipping_method;
        } else if (this.availableShippingMethods.length > 0) {
          // Select first shipping method if none selected
          this.selectedShippingMethod = this.availableShippingMethods[0].id;
        }
      }

      // Restore billing-same-as-shipping state from the saved cart
      if (this.cartData?.is_billing_same_as_shipping) {
        this.billingSameAsShipping = true;
      }

      // Initialize discount state from cart data
      if (this.cartData?.pricing?.discount_details) {
        this.discount = this.cartData.pricing.display_discount_total_money_object.display || null;
        this.appliedCouponCode = this.cartData.pricing.discount_details?.code ?? '';
      }

      // Debounced cart update — prevents hammering the API on rapid field changes
      const debouncedUpdateCart = debounce(() => this.updateCart(), 400);

      listen('kecom:address:changed', () => debouncedUpdateCart());
    },

    async updateCart() {
      try {
        const shippingFormEl = document.querySelector('#shipping-form');
        const billingFormEl = document.querySelector('#billing-form');
        const shippingForm: AlpineFormData = window.Alpine.$data(shippingFormEl);
        const billingForm: AlpineFormData | null = this.billingSameAsShipping
          ? null
          : window.Alpine.$data(billingFormEl);

        const cartData = {
          shipping_address: {
            first_name: shippingForm.values.first_name,
            last_name: shippingForm.values.last_name,
            email: shippingForm.values.email,
            phone: shippingForm.values.phone,
            address_line1: shippingForm.values.address_line1,
            address_line2: shippingForm.values.address_line2 || '',
            city: shippingForm.values.city,
            state: shippingForm.values.state,
            postal_code: shippingForm.values.postal_code,
            country: shippingForm.values.country,
          },
          is_billing_same_as_shipping: this.billingSameAsShipping,
          shipping_method: this.selectedShippingMethod,
          ...(billingForm
            ? {
                billing_address: {
                  first_name: billingForm.values.first_name,
                  last_name: billingForm.values.last_name,
                  email: billingForm.values.email,
                  phone: billingForm.values.phone,
                  address_line1: billingForm.values.address_line1,
                  address_line2: billingForm.values.address_line2 || '',
                  city: billingForm.values.city,
                  state: billingForm.values.state,
                  postal_code: billingForm.values.postal_code,
                  country: billingForm.values.country,
                },
              }
            : {}),
        };

        const response = await cartApi.update(cartData);
        this.cartData = response.data;
        this.availableShippingMethods = response.data.available_shipping_methods || [];

        // Update selected shipping method if it changed
        if (response.data.shipping_method) {
          this.selectedShippingMethod = response.data.shipping_method?.id ?? response.data.shipping_method;
        }

        // Keep discount state in sync with the refreshed cart
        if (response.data?.pricing?.discount_details) {
          this.discount = response.data.pricing?.display_discount_total_money_object.display || null;
          this.appliedCouponCode = response.data.pricing?.discount_details?.code ?? '';
        }
      } catch (e: unknown) {
        handleApiErrors(
          e as Error & { errors?: Record<string, string[]> },
          __('Failed to update cart', 'kirki-ecommerce'),
        );
      }
    },

    setShippingMethod(methodId: string) {
      this.selectedShippingMethod = methodId;
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
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : __('Failed to apply coupon', 'kirki-ecommerce');
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
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : __('Failed to remove coupon', 'kirki-ecommerce');
        this.error = error;
        toastManager.error(error);
      } finally {
        this.couponLoading = false;
      }
    },

    setPaymentMethod(method: string) {
      this.selectedPaymentMethod = method;
      (this as unknown as AlpineContext).$dispatch('payment-method-change', { method });
    },

    async placeOrder() {
      this.error = null;

      try {
        // Validate both forms concurrently — dispatch triggers each form's
        // validateForm() which fires back *-form-validated on the window
        (this as unknown as AlpineContext).$dispatch('kecom:shipping-form:validate');

        // Only validate billing independently when it differs from shipping
        if (!this.billingSameAsShipping) {
          (this as unknown as AlpineContext).$dispatch('kecom:billing-form:validate');
        }

        const validationPromises: Promise<FormValidatedDetail>[] = [
          waitForEvent('kecom:shipping-form:validated'),
          this.billingSameAsShipping
            ? Promise.resolve({ isValid: true })
            : waitForEvent('kecom:billing-form:validated'),
        ];

        const [shippingResult, billingResult] = await Promise.all(validationPromises);

        this.shippingFormValid = shippingResult.isValid;
        this.billingFormValid = billingResult.isValid;

        if (!this.shippingFormValid) {
          scrollToFirstError();
          return;
        }

        if (!this.billingFormValid) {
          scrollToFirstError();
          return;
        }

        if (!this.cartData?.items?.length) {
          toastManager.error(__('Your cart is empty', 'kirki-ecommerce'));
          return;
        }

        // Start loading after validation passes
        this.loading = true;

        // Collect form data
        const shippingFormEl = document.querySelector('#shipping-form');
        const billingFormEl = document.querySelector('#billing-form');
        const shippingForm: AlpineFormData = window.Alpine.$data(shippingFormEl);
        const billingForm: AlpineFormData | null = this.billingSameAsShipping
          ? null
          : window.Alpine.$data(billingFormEl);

        // Prepare order data
        const orderData: CheckoutRequest = {
          items: this.cartData.items.map((item) => ({
            variant_id: item.product.variant_id,
            quantity: item.quantity,
          })),
          currency_code: this.currency,
          payment_provider: this.selectedPaymentMethod,
          coupon_code: this.appliedCouponCode || undefined,
          shipping_method: this.selectedShippingMethod || undefined,
          is_billing_same_as_shipping: this.billingSameAsShipping,
          shipping_first_name: shippingForm.values.first_name,
          shipping_last_name: shippingForm.values.last_name,
          shipping_address_line1: shippingForm.values.address_line1,
          shipping_address_line2: shippingForm.values.address_line2 || '',
          shipping_city: shippingForm.values.city,
          shipping_state: shippingForm.values.state,
          shipping_postcode: shippingForm.values.postal_code,
          shipping_country: shippingForm.values.country,
          shipping_phone: shippingForm.values.phone,
          shipping_email: shippingForm.values.email,
          shipping_company: null,
          ...(billingForm
            ? {
                billing_first_name: billingForm.values.first_name,
                billing_last_name: billingForm.values.last_name,
                billing_address_line1: billingForm.values.address_line1,
                billing_address_line2: billingForm.values.address_line2 || '',
                billing_city: billingForm.values.city,
                billing_state: billingForm.values.state,
                billing_postcode: billingForm.values.postal_code,
                billing_country: billingForm.values.country,
                billing_phone: billingForm.values.phone,
                billing_email: billingForm.values.email,
                billing_company: null,
              }
            : {}),
          customer_email: shippingForm.values.email,
          customer_phone: shippingForm.values.phone,
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
            await this.renderPaymentGatewayHTML(value);
          }
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set('order', 'success');
          url.searchParams.set('uuid', data.uuid);
          window.location.href = url.toString();
        }
      } catch (e: unknown) {
        const err = e as Error & { errors?: Record<string, string[]> };
        this.error = err.message ?? __('Checkout failed', 'kirki-ecommerce');
        handleApiErrors(err, __('Checkout failed', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },
    async renderPaymentGatewayHTML(html: string) {
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);

      const scripts = Array.from(container.querySelectorAll('script'));

      for (const oldScript of scripts) {
        const newScript = document.createElement('script');

        // Copy attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        if (oldScript.src) {
          // External script: wait until it has loaded
          await new Promise<void>((resolve, reject) => {
            newScript.onload = () => resolve();
            newScript.onerror = () => reject(new Error(`Failed to load script: ${oldScript.src}`));

            document.head.appendChild(newScript);
          });
        } else {
          // Inline script
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
        }

        oldScript.remove();
      }

      // Submit form only if needed
      const form = container.querySelector<HTMLFormElement>('form');

      if (form) {
        form.submit();
      }
    },
  };
}
