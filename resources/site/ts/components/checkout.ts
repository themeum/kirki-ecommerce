/**
 * Alpine component: checkout
 * Handles checkout form interactions and validation.
 *
 * PHP usage:
 *   <form x-data="checkout({ 
 *     cartTotal: <?= $cart->total ?>,
 *     currency: '<?= $currency ?>'
 *   })">
 */

export interface CheckoutField {
  value: string;
  error: string | null;
  touched: boolean;
}

export interface CheckoutConfig {
  cartTotal?: number;
  currency?: string;
}

export function checkout(config: CheckoutConfig = {}) {
  return {
    cartTotal: config.cartTotal ?? 0,
    currency: config.currency ?? 'USD',
    
    // Form fields
    fields: {
      billing_first_name: { value: '', error: null, touched: false },
      billing_last_name: { value: '', error: null, touched: false },
      billing_email: { value: '', error: null, touched: false },
      billing_phone: { value: '', error: null, touched: false },
      billing_address_1: { value: '', error: null, touched: false },
      billing_city: { value: '', error: null, touched: false },
      billing_postcode: { value: '', error: null, touched: false },
      billing_country: { value: '', error: null, touched: false },
      shipping_first_name: { value: '', error: null, touched: false },
      shipping_last_name: { value: '', error: null, touched: false },
      shipping_address_1: { value: '', error: null, touched: false },
      shipping_city: { value: '', error: null, touched: false },
      shipping_postcode: { value: '', error: null, touched: false },
      shipping_country: { value: '', error: null, touched: false },
    } as Record<string, CheckoutField>,

    shipToDifferentAddress: false,
    selectedPaymentMethod: '',
    orderNotes: '',
    
    loading: false,
    error: null as string | null,
    success: false,

    get isValid(): boolean {
      return Object.values(this.fields).every(field => !field.error);
    },

    validateField(fieldName: string) {
      const field = this.fields[fieldName];
      field.touched = true;
      field.error = null;

      const value = field.value.trim();

      // Required fields validation
      const requiredFields = [
        'billing_first_name',
        'billing_last_name', 
        'billing_email',
        'billing_address_1',
        'billing_city',
        'billing_country',
      ];

      if (requiredFields.includes(fieldName) && !value) {
        field.error = 'This field is required';
        return;
      }

      // Email validation
      if (fieldName === 'billing_email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          field.error = 'Please enter a valid email address';
        }
      }

      // Phone validation (if provided)
      if (fieldName === 'billing_phone' && value) {
        const phoneRegex = /^[\d\s\-+()]+$/;
        if (!phoneRegex.test(value)) {
          field.error = 'Please enter a valid phone number';
        }
      }
    },

    handleBlur(fieldName: string) {
      this.validateField(fieldName);
    },

    handleInput(fieldName: string, value: string) {
      this.fields[fieldName].value = value;
      if (this.fields[fieldName].touched) {
        this.validateField(fieldName);
      }
    },

    toggleShippingAddress() {
      this.shipToDifferentAddress = !this.shipToDifferentAddress;
    },

    setPaymentMethod(method: string) {
      this.selectedPaymentMethod = method;
      (this as any).$dispatch('payment-method-change', { method });
    },

    async submit(event: Event) {
      event.preventDefault();
      
      // Validate all fields
      Object.keys(this.fields).forEach(fieldName => {
        this.validateField(fieldName);
      });

      if (!this.isValid) {
        this.error = 'Please fix the errors above';
        return;
      }

      if (!this.selectedPaymentMethod) {
        this.error = 'Please select a payment method';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        // Dispatch submit event with form data
        const formData = {
          billing: {
            first_name: this.fields.billing_first_name.value,
            last_name: this.fields.billing_last_name.value,
            email: this.fields.billing_email.value,
            phone: this.fields.billing_phone.value,
            address_1: this.fields.billing_address_1.value,
            city: this.fields.billing_city.value,
            postcode: this.fields.billing_postcode.value,
            country: this.fields.billing_country.value,
          },
          shipping: { ...this.fields.billing },
          ship_to_different_address: this.shipToDifferentAddress,
          payment_method: this.selectedPaymentMethod,
          order_notes: this.orderNotes,
        };

        (this as any).$dispatch('checkout-submit', { formData });
        
        // The actual submission will be handled by the form's native submit
        // or by listening to the checkout-submit event
        (event.target as HTMLFormElement).submit();
        
      } catch (e: unknown) {
        this.error = e instanceof Error ? e.message : 'Checkout failed';
      } finally {
        this.loading = false;
      }
    },
  };
}
