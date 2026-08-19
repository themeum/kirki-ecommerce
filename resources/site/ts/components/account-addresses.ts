/**
 * Account Addresses Alpine Component
 * Handles viewing and saving billing & shipping addresses via PUT {{baseUrl}}/customers/{id}
 */

import { customerApi, type CustomerAddressPayload } from '../api/customer';
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

export interface CustomerData {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  photo?: number | null;
  accepts_marketing?: boolean;
  notes?: string | null;
  language?: string;
  tags?: string[];
  is_billing_same_as_shipping?: boolean;
}

export interface AccountAddressesConfig {
  customerId: number;
  customerData?: CustomerData;
  addresses?: {
    billing: AddressItem;
    shipping: AddressItem;
  };
  countries?: Array<{
    code: string;
    name: string;
    states?: Array<{ id: string | number; name: string }>;
  }>;
}

export function accountAddresses(config: AccountAddressesConfig) {
  const toast = toastMeta.component();
  const initialSameAsBilling = Boolean(config.customerData?.is_billing_same_as_shipping);

  return {
    customerId: Number(config.customerId) || 1,
    customerData: config.customerData || {},
    addresses: config.addresses || {
      billing: {} as AddressItem,
      shipping: {} as AddressItem,
    },
    countries: config.countries || [],
    editingAddress: null as 'billing' | 'shipping' | null,
    sameAsBilling: initialSameAsBilling,
    customShippingAddress: { ...(config.addresses?.shipping || {}) } as AddressItem,
    togglingSameAsBilling: false,
    loading: false,
    errorMessage: '',
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
    },

    get availableStates() {
      if (!this.formData.country) return [];
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === this.formData.country,
      );
      return country && country.states ? country.states : [];
    },

    getCountryName(code?: string): string {
      if (!code) return '';
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === code,
      );
      return country ? country.name : code;
    },

    getStateName(countryCode?: string, stateVal?: string | number): string {
      if (!stateVal || !countryCode) return String(stateVal || '');
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === countryCode,
      );
      if (!country || !country.states) return String(stateVal);
      const state = country.states.find(
        (s: any) => String(s.id) === String(stateVal) || s.name === String(stateVal),
      );
      return state ? state.name : String(stateVal);
    },

    getAddress(type: 'billing' | 'shipping'): AddressItem {
      return type === 'shipping' && this.sameAsBilling ? (this.addresses.billing || {}) : (this.addresses[type] || {});
    },

    getDisplayName(type: 'billing' | 'shipping'): string {
      const addr = this.getAddress(type);
      if (!addr) return '';
      const name = `${addr.first_name || ''} ${addr.last_name || ''}`.trim();
      return name || this.customerData.first_name || '';
    },

    getCityStateZip(type: 'billing' | 'shipping'): string {
      const addr = this.getAddress(type);
      if (!addr) return '';
      const state = this.getStateName(addr.country, addr.state);
      const parts = [addr.city, state].filter(Boolean).join(', ');
      return `${parts} ${addr.postal_code || ''}`.trim();
    },

    hasAddress(type: 'billing' | 'shipping'): boolean {
      if (type === 'shipping' && this.sameAsBilling) {
        return Boolean(this.addresses.billing && (this.addresses.billing.address_line1 || this.addresses.billing.first_name));
      }
      const addr = this.addresses[type];
      return Boolean(addr && (addr.address_line1 || addr.first_name));
    },

    startEdit(type: 'billing' | 'shipping') {
      this.editingAddress = type;
      this.errorMessage = '';
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
      };
    },

    cancelEdit() {
      this.editingAddress = null;
      this.errorMessage = '';
    },

    async onSameAsBillingChange() {
      if (this.togglingSameAsBilling) return;
      this.togglingSameAsBilling = true;

      try {
        if (this.sameAsBilling) {
          // Backup current custom shipping address in memory
          this.customShippingAddress = { ...this.addresses.shipping };
          // Mirror billing to shipping
          this.addresses.shipping = { ...this.addresses.billing };

          const payload = {
            is_billing_same_as_shipping: true,
            shipping_address: {
              first_name: this.addresses.billing.first_name || '',
              last_name: this.addresses.billing.last_name || '',
              company: this.addresses.billing.company || '',
              country: this.addresses.billing.country || '',
              address_line1: this.addresses.billing.address_line1 || '',
              address_line2: this.addresses.billing.address_line2 || '',
              city: this.addresses.billing.city || '',
              state: String(this.addresses.billing.state || ''),
              postal_code: this.addresses.billing.postal_code || '',
              phone: this.addresses.billing.phone || '',
              email: this.customerData.email || '',
            },
          };

          await customerApi.updateCustomer(this.customerId, payload);
          toast.success('Shipping address set to same as billing.');
        } else {
          // Restore previous custom shipping address
          this.addresses.shipping = { ...this.customShippingAddress };

          const payload = {
            is_billing_same_as_shipping: false,
            shipping_address: {
              first_name: this.addresses.shipping.first_name || '',
              last_name: this.addresses.shipping.last_name || '',
              company: this.addresses.shipping.company || '',
              country: this.addresses.shipping.country || '',
              address_line1: this.addresses.shipping.address_line1 || '',
              address_line2: this.addresses.shipping.address_line2 || '',
              city: this.addresses.shipping.city || '',
              state: String(this.addresses.shipping.state || ''),
              postal_code: this.addresses.shipping.postal_code || '',
              phone: this.addresses.shipping.phone || '',
              email: this.customerData.email || '',
            },
          };

          await customerApi.updateCustomer(this.customerId, payload);
          toast.info('Separate shipping address enabled.');
        }
      } catch (err: any) {
        // Revert UI toggle on error
        this.sameAsBilling = !this.sameAsBilling;
        toast.error(err?.message || 'Failed to update shipping address preference.');
      } finally {
        this.togglingSameAsBilling = false;
      }
    },

    async saveAddress() {
      if (!this.editingAddress || this.loading) return;
      this.loading = true;
      this.errorMessage = '';

      const type = this.editingAddress;

      try {
        const addressPayload: CustomerAddressPayload = {
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
          email: this.customerData.email || '',
        };

        const payload = {
          [type === 'billing' ? 'billing_address' : 'shipping_address']: addressPayload,
        };

        const res = await customerApi.updateCustomer(this.customerId, payload);

        // Update local reactive state
        this.addresses[type] = {
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
        };

        // If billing updated and sameAsBilling is active, update shipping copy as well
        if (type === 'billing' && this.sameAsBilling) {
          this.addresses.shipping = { ...this.addresses.billing };
        }

        this.editingAddress = null;
        toast.success(res?.message || 'Address updated successfully.');
      } catch (err: any) {
        const msg = err?.message || 'Failed to update address. Please try again.';
        this.errorMessage = msg;
        toast.error(msg);
      } finally {
        this.loading = false;
      }
    },
  };
}
