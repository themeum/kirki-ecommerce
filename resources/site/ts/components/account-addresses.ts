/**
 * Account Addresses Alpine Component
 * Handles viewing and saving billing & shipping addresses via POST /account/addresses
 */

import { type AccountAddressPayload, accountApi } from '../api/account';
import { config } from '../utils';
import { toastMeta } from './toast';

export interface AddressItem {
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export function accountAddresses() {
  const { __ } = window.wp.i18n;
  const toast = toastMeta.component();

  // Map API field names to human-readable labels for error messages
  const fieldLabels: Record<string, string> = {
    first_name: __('first name', 'kirki-ecommerce'),
    last_name: __('last name', 'kirki-ecommerce'),
    email: __('email address', 'kirki-ecommerce'),
    phone: __('phone number', 'kirki-ecommerce'),
    address_line1: __('address', 'kirki-ecommerce'),
    address_line2: __('apartment / suite', 'kirki-ecommerce'),
    city: __('city', 'kirki-ecommerce'),
    state: __('state', 'kirki-ecommerce'),
    postal_code: __('postal code', 'kirki-ecommerce'),
    country: __('country', 'kirki-ecommerce'),
  };

  function humanizeFieldError(rawMessage: string, fieldName: string): string {
    const label = fieldLabels[fieldName] ?? fieldName.replace(/_/g, ' ');
    return rawMessage
      .replace(new RegExp(`\\b${fieldName}\\b`, 'g'), label)
      .replace(/shipping_address\.\w+/g, label)
      .replace(/billing_address\.\w+/g, label);
  }

  const initialSameAsShipping = Boolean(
    config?.is_billing_same_as_shipping ?? config?.isBillingSameAsShipping,
  );
  const addresses = config?.addresses ?? {
    billing: {},
    shipping: {},
  };
  const countries =
    (config?.countries as {
      code: string;
      name: string;
      states?: { id: string | number; name: string }[];
    }[]) ?? [];

  return {
    addresses,
    countries,
    editingAddress: null as 'billing' | 'shipping' | null,
    sameAsShipping: initialSameAsShipping,
    customBillingAddress: { ...(addresses?.billing ?? {}) },
    togglingSameAsShipping: false,
    loading: false,
    errorMessage: '',
    errors: {} as Record<string, string>,
    formData: {
      first_name: '',
      last_name: '',
      company: '',
      country: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      phone: '',
      email: '',
    },

    get availableStates() {
      if (!this.formData.country) {
        return [];
      }
      const country = this.countries.find((c: any) => (c.code || c.id) === this.formData.country);
      return country?.states ?? [];
    },

    getCountryName(code?: string): string {
      if (!code) {
        return '';
      }
      const country = this.countries.find((c: any) => (c.code || c.id) === code);
      return country ? country.name : code;
    },

    getStateName(countryCode?: string, stateVal?: string | number): string {
      if (!stateVal || !countryCode) {
        return String(stateVal || '');
      }
      const country = this.countries.find((c: any) => (c.code || c.id) === countryCode);
      if (!country?.states) {
        return String(stateVal);
      }
      const state = country.states.find(
        (s: any) => String(s.id) === String(stateVal) || s.name === String(stateVal),
      );
      return state ? state.name : String(stateVal);
    },

    getAddress(type: 'billing' | 'shipping'): AddressItem {
      return type === 'billing' && this.sameAsShipping
        ? this.addresses.shipping || {}
        : this.addresses[type] || {};
    },

    getDisplayName(type: 'billing' | 'shipping'): string {
      const addr = this.getAddress(type);
      if (!addr) {
        return '';
      }
      return `${addr.first_name || ''} ${addr.last_name || ''}`.trim();
    },

    getCityStateZip(type: 'billing' | 'shipping'): string {
      const addr = this.getAddress(type);
      if (!addr) {
        return '';
      }
      const state = this.getStateName(addr.country, addr.state);
      const parts = [addr.city, state].filter(Boolean).join(', ');
      return `${parts} ${addr.postal_code || ''}`.trim();
    },

    hasAddress(type: 'billing' | 'shipping'): boolean {
      if (type === 'billing' && this.sameAsShipping) {
        return Boolean(
          this.addresses.shipping &&
          (this.addresses.shipping.address_line1 || this.addresses.shipping.first_name),
        );
      }
      const addr = this.addresses[type];
      return Boolean(addr && (addr.address_line1 || addr.first_name));
    },

    startEdit(type: 'billing' | 'shipping') {
      this.editingAddress = type;
      this.errorMessage = '';
      this.errors = {};
      const current = this.addresses[type] || {};
      this.formData = {
        first_name: current.first_name || '',
        last_name: current.last_name || '',
        company: current.company || '',
        country: current.country || '',
        address_line1: current.address_line1 || '',
        address_line2: current.address_line2 || '',
        city: current.city || '',
        state: current.state || '',
        postal_code: current.postal_code || '',
        phone: current.phone || '',
        email: current.email || '',
      };
    },

    cancelEdit() {
      this.editingAddress = null;
      this.errorMessage = '';
      this.errors = {};
    },

    async onSameAsShippingChange() {
      if (this.togglingSameAsShipping) {
        return;
      }
      this.togglingSameAsShipping = true;

      try {
        if (this.sameAsShipping) {
          // Backup current custom billing address in memory
          this.customBillingAddress = { ...this.addresses.billing };
          // Mirror shipping to billing
          this.addresses.billing = { ...this.addresses.shipping };
        } else {
          // Restore previous custom billing address
          this.addresses.billing = { ...this.customBillingAddress };
        }

        const payload: AccountAddressPayload = {
          type: 'billing',
          first_name: this.addresses.billing?.first_name || '',
          last_name: this.addresses.billing?.last_name || '',
          company: this.addresses.billing?.company || '',
          country: this.addresses.billing?.country || '',
          address_line1: this.addresses.billing?.address_line1 || '',
          address_line2: this.addresses.billing?.address_line2 || '',
          city: this.addresses.billing?.city || '',
          state: String(this.addresses.billing?.state || ''),
          postal_code: this.addresses.billing?.postal_code || '',
          phone: this.addresses.billing?.phone || '',
          email: this.addresses.billing?.email || '',
          is_billing_same_as_shipping: this.sameAsShipping,
        };

        await accountApi.updateAddress(payload);

        if (this.sameAsShipping) {
          toast.success('Billing address set to same as shipping.');
        } else {
          toast.info('Separate billing address enabled.');
        }
      } catch (err: any) {
        // Revert UI toggle on error
        this.sameAsShipping = !this.sameAsShipping;
        if (this.sameAsShipping) {
          this.addresses.billing = { ...this.addresses.shipping };
        } else {
          this.addresses.billing = { ...this.customBillingAddress };
        }
        toast.error(err?.message || 'Failed to update billing address preference.');
      } finally {
        this.togglingSameAsShipping = false;
      }
    },

    async saveAddress() {
      if (!this.editingAddress || this.loading) {
        return;
      }
      this.loading = true;
      this.errorMessage = '';
      this.errors = {};

      const type = this.editingAddress;

      try {
        const payload: AccountAddressPayload = {
          type,
          first_name: this.formData.first_name || '',
          last_name: this.formData.last_name || '',
          company: this.formData.company || '',
          country: this.formData.country || '',
          address_line1: this.formData.address_line1 || '',
          address_line2: this.formData.address_line2 || '',
          city: this.formData.city || '',
          state: String(this.formData.state || ''),
          postal_code: this.formData.postal_code || '',
          phone: this.formData.phone || '',
          email: this.formData.email || '',
          ...(type === 'billing' ? { is_billing_same_as_shipping: false } : {}),
        };

        const res = await accountApi.updateAddress(payload);

        // Update local reactive state
        this.addresses[type] = {
          ...this.addresses[type],
          first_name: this.formData.first_name,
          last_name: this.formData.last_name,
          company: this.formData.company,
          country: this.formData.country,
          address_line1: this.formData.address_line1,
          address_line2: this.formData.address_line2,
          city: this.formData.city,
          state: this.formData.state,
          postal_code: this.formData.postal_code,
          phone: this.formData.phone,
          email: this.formData.email,
        };

        if (type === 'billing') {
          this.sameAsShipping = false;
        }

        // If shipping updated and sameAsShipping is active, update billing copy as well
        if (type === 'shipping' && this.sameAsShipping) {
          this.addresses.billing = { ...this.addresses.shipping };
        }

        this.editingAddress = null;
        toast.success(res?.message || 'Address updated successfully.');
      } catch (err: any) {
        if (err?.errors && typeof err.errors === 'object') {
          let hasFieldErrors = false;
          for (const [key, messages] of Object.entries(err.errors)) {
            const field = key.replace(/^(billing|shipping)_address\./, '');
            const rawMsg = Array.isArray(messages) ? messages[0] : (messages as string);
            if (rawMsg) {
              const cleanMsg = humanizeFieldError(rawMsg, field);
              this.errors[field] = cleanMsg;
              hasFieldErrors = true;
            }
          }
          if (hasFieldErrors) {
            this.errorMessage = err.message || 'Validation failed!';
            toast.error(this.errorMessage);
            return;
          }
        }
        const msg = err?.message || 'Failed to update address. Please try again.';
        this.errorMessage = msg;
        toast.error(msg);
      } finally {
        this.loading = false;
      }
    },
  };
}
