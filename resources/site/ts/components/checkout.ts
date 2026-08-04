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

import { toastManager } from "../services/toast/runtime";
import { cartApi } from "../api/cart";

export interface CheckoutConfig {
  cartTotal?: number;
  currency?: string;
}

export function checkout(config: CheckoutConfig = {}) {
  const { __ } = window.wp.i18n;

  return {
    cartTotal: config.cartTotal ?? 0,
    currency: config.currency ?? 'USD',

    selectedPaymentMethod: 'stripe',
    couponCode: '',
    discount: 0,
    billingFormValid: false,
    shippingFormValid: false,
    billingSameAsShipping: false,
    cartData: null as any,

    loading: false,
    couponLoading: false,
    error: null as string | null,
    success: false,

    init() {
      (this as any).$el.addEventListener('billing-form-validated', (e: any) => {
        this.billingFormValid = e.detail.isValid;
      });
      (this as any).$el.addEventListener('shipping-form-validated', (e: any) => {
        this.shippingFormValid = e.detail.isValid;
      });

      // Watch for billingSameAsShipping changes
      (this as any).$watch('billingSameAsShipping', (value: boolean) => {
        if (value) {
          (this as any).$dispatch('sync-billing-from-shipping');
        }
      });
    },

    async applyCoupon() {
      if (!this.couponCode.trim()) {
        toastManager.error(__('Please enter a coupon code', 'kirki-ecommerce'));
        return;
      }
      this.couponLoading = true;
      try {
        const response = await cartApi.applyCoupon(this.couponCode);
        this.cartData = response.data;
        this.discount = parseFloat(response.data.pricing.discount_total) || 0;
        toastManager.success(__('Coupon applied successfully!', 'kirki-ecommerce'));
      } catch (e: unknown) {
        const error = e instanceof Error ? e.message : __('Failed to apply coupon', 'kirki-ecommerce');
        toastManager.error(error);
      } finally {
        this.couponLoading = false;
      }
    },

    setPaymentMethod(method: string) {
      this.selectedPaymentMethod = method;
      (this as any).$dispatch('payment-method-change', { method });
    },

    async placeOrder() {
      this.error = null;
      this.billingFormValid = false;
      this.shippingFormValid = false;

      try {
        // Validate shipping form via event dispatch
        (this as any).$dispatch('validate-shipping-form');

        // Wait for shipping validation response
        await new Promise<void>((resolve) => {
          const checkValidation = () => {
            if (this.shippingFormValid !== false) {
              resolve();
            } else {
              setTimeout(checkValidation, 10);
            }
          };
          setTimeout(checkValidation, 10);
        });

        if (!this.shippingFormValid) {
          toastManager.error(__('Please fix the shipping form errors', 'kirki-ecommerce'));
          return;
        }

        // Validate billing form via event dispatch
        (this as any).$dispatch('validate-billing-form');

        // Wait for billing validation response
        await new Promise<void>((resolve) => {
          const checkValidation = () => {
            if (this.billingFormValid !== false) {
              resolve();
            } else {
              setTimeout(checkValidation, 10);
            }
          };
          setTimeout(checkValidation, 10);
        });

        if (!this.billingFormValid) {
          toastManager.error(__('Please fix the billing form errors', 'kirki-ecommerce'));
          return;
        }

        // Start loading after validation passes
        this.loading = true;

        // TODO: Collect data and make AJAX call to create order

        toastManager.success(__('Order placed successfully!', 'kirki-ecommerce'));

        // TODO: Redirect to thank you page
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : __('Checkout failed', 'kirki-ecommerce');
        toastManager.error(this.error || __('Checkout failed', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },
  };
}
