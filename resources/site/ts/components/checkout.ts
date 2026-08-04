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
import { orderApi } from "../api/order";
import type { OrderRequest } from "../types";

export interface CheckoutConfig {
  cartTotal?: number;
}

export function checkout(config: CheckoutConfig = {}) {
  const { __ } = window.wp.i18n;

  return {
    cartTotal: config.cartTotal ?? 0,
    currency: window.kirki_ecommerce?.currency ?? 'USD',
    cartData: window.kirki_ecommerce?.checkout_cart ?? null,

    selectedPaymentMethod: 'stripe',
    couponCode: '',
    discount: 0,
    billingFormValid: false,
    shippingFormValid: false,
    billingSameAsShipping: false,

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
          this.syncBillingFromShipping();
        }
      });
    },

    syncBillingFromShipping() {
      const shippingFormEl = document.querySelector('#shipping-form') as any;
      const billingFormEl = document.querySelector('#billing-form') as any;

      const shippingForm = (window as any).Alpine.$data(shippingFormEl);
      const billingForm = (window as any).Alpine.$data(billingFormEl);

      if (shippingForm?.values && billingForm?.values) {
        billingForm.values.country = shippingForm.values.country;
        billingForm.values.first_name = shippingForm.values.first_name;
        billingForm.values.last_name = shippingForm.values.last_name;
        billingForm.values.address_line1 = shippingForm.values.address_line1;
        billingForm.values.address_line2 = shippingForm.values.address_line2;
        billingForm.values.city = shippingForm.values.city;
        billingForm.values.state = shippingForm.values.state;
        billingForm.values.postal_code = shippingForm.values.postal_code;
        billingForm.values.phone = shippingForm.values.phone;
        billingForm.values.email = shippingForm.values.email;

        // Trigger validation to clear any previous errors
        (this as any).$dispatch('validate-billing-form');
      }
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

        // Collect form data
        const shippingFormEl = document.querySelector('#shipping-form') as any;
        const billingFormEl = document.querySelector('#billing-form') as any;
        const shippingForm = (window as any).Alpine.$data(shippingFormEl);
        const billingForm = (window as any).Alpine.$data(billingFormEl);

        // Prepare order data
        const orderData: OrderRequest = {
          items: this.cartData?.items.map((item: any) => ({
            variant_id: item.product.variant_id,
            quantity: item.quantity,
          })) || [],
          currency_code: this.currency,
          payment_method: this.selectedPaymentMethod,
          coupon_code: this.couponCode || undefined,
          shipping_method: this.cartData?.shipping_method || undefined,
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
          customer_email: billingForm.values.email,
          customer_phone: billingForm.values.phone,
          customer_notes: null,
        };

        // Create order
        const response = await orderApi.create(orderData);
        toastManager.success(__('Order placed successfully!', 'kirki-ecommerce'));

        // Redirect to thank you page
        const thankYouUrl = window.kirki_ecommerce?.thank_you_url || '/thank-you';
        window.location.href = `${thankYouUrl}?order_id=${response.data.id}`;
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : __('Checkout failed', 'kirki-ecommerce');
        toastManager.error(this.error || __('Checkout failed', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },
  };
}
