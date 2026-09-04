/**
 * Account Addresses Alpine Component
 * Handles viewing, adding, editing, deleting, and setting default addresses via REST API
 */

import { type AccountAddressPayload, accountApi } from '../api/account';
import { toastManager } from '../services/toast/runtime';
import { config } from '../utils';

export interface AddressItem {
  id: number | string;
  type?: string;
  label?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
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

export interface AddressFormData {
  type: string;
  label: string;
  first_name: string;
  last_name: string;
  company: string;
  country: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export function accountAddresses() {
  const { __ } = window.wp.i18n;

  // Normalize initial addresses from config
  const rawAddresses = config?.addresses;
  let initialAddresses: AddressItem[] = [];

  if (Array.isArray(rawAddresses)) {
    initialAddresses = rawAddresses;
  } else if (rawAddresses && typeof rawAddresses === 'object') {
    // Legacy support for { shipping: {...}, billing: {...} }
    const items: AddressItem[] = [];
    if (rawAddresses.shipping && (rawAddresses.shipping.address_line1 || rawAddresses.shipping.first_name)) {
      items.push({
        label: rawAddresses.shipping.label || __('Home', 'kirki-ecommerce'),
        is_default_shipping: true,
        is_default_billing: false,
        ...rawAddresses.shipping,
        id: rawAddresses.shipping.id || 1,
      });
    }
    if (rawAddresses.billing && (rawAddresses.billing.address_line1 || rawAddresses.billing.first_name)) {
      items.push({
        label: rawAddresses.billing.label || __('Work', 'kirki-ecommerce'),
        is_default_shipping: false,
        is_default_billing: true,
        ...rawAddresses.billing,
        id: rawAddresses.billing.id || 2,
      });
    }
    initialAddresses = items;
  }

  const countries =
    (config?.countries as {
      code: string;
      name: string;
      states?: { id: string | number; name: string }[];
    }[]) ?? [];

  return {
    addresses: initialAddresses,
    countries,
    modalOpen: false,
    isEditing: false,
    editingId: null as number | string | null,
    activeMenuId: null as number | string | null,
    loading: false,
    errors: {} as Record<string, string>,
    formData: {
      type: 'home',
      label: '',
      first_name: '',
      last_name: '',
      company: '',
      country: countries[0]?.code || '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      phone: '',
      email: '',
      is_default_shipping: false,
      is_default_billing: false,
    } as AddressFormData,

    get availableStates() {
      if (!this.formData.country) {
        return [];
      }
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === this.formData.country,
      );
      return country?.states ?? [];
    },

    getCountryName(code?: string): string {
      if (!code) {
        return '';
      }
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === code,
      );
      return country ? country.name : code;
    },

    getStateName(countryCode?: string, stateVal?: string | number): string {
      if (!stateVal || !countryCode) {
        return String(stateVal || '');
      }
      const country = this.countries.find(
        (c: any) => (c.code || c.id) === countryCode,
      );
      if (!country?.states) {
        return String(stateVal);
      }
      const state = country.states.find(
        (s: any) => String(s.id) === String(stateVal) || s.name === String(stateVal),
      );
      return state ? state.name : String(stateVal);
    },

    getCityStateZip(addr: AddressItem): string {
      if (!addr) {
        return '';
      }
      const state = this.getStateName(addr.country, addr.state);
      const parts = [addr.city, state].filter(Boolean).join(', ');
      return `${parts} ${addr.postal_code || ''}`.trim();
    },

    getFormattedAddressLines(addr: AddressItem): string {
      if (!addr) {
        return '';
      }
      return [addr.address_line1, addr.address_line2].filter(Boolean).join(', ');
    },

    toggleMenu(id: number | string) {
      this.activeMenuId = this.activeMenuId === id ? null : id;
    },

    closeMenu() {
      this.activeMenuId = null;
    },

    openAddModal() {
      this.isEditing = false;
      this.editingId = null;
      this.activeMenuId = null;
      this.errors = {};
      const defaultCountry = this.countries[0]?.code || '';
      this.formData = {
        type: 'home',
        label: '',
        first_name: '',
        last_name: '',
        company: '',
        country: defaultCountry,
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        phone: '',
        email: '',
        is_default_shipping: this.addresses.length === 0,
        is_default_billing: this.addresses.length === 0,
      };
      this.modalOpen = true;
    },

    openEditModal(address: AddressItem) {
      this.isEditing = true;
      this.editingId = address.id;
      this.activeMenuId = null;
      this.errors = {};

      let resolvedType = (address.type || 'home').toLowerCase();
      if (resolvedType === 'office') {
        resolvedType = 'work';
      } else if (resolvedType === 'others') {
        resolvedType = 'other';
      }

      this.formData = {
        type: resolvedType,
        label: address.label || '',
        first_name: address.first_name || '',
        last_name: address.last_name || '',
        company: address.company || '',
        country: address.country || this.countries[0]?.code || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        phone: address.phone || '',
        email: address.email || '',
        is_default_shipping: Boolean(address.is_default_shipping),
        is_default_billing: Boolean(address.is_default_billing),
      };
      this.modalOpen = true;
    },

    onTypeChange() {
      delete this.errors.label;
      if (this.formData.type !== 'other') {
        this.formData.label = '';
      }
    },

    getAddressLabel(address: AddressItem): string {
      const type = (address?.type || '').toLowerCase();
      if (type === 'home') {
        return __('Home', 'kirki-ecommerce');
      }
      if (type === 'work' || type === 'office') {
        return __('Work', 'kirki-ecommerce');
      }
      if (type === 'other' || type === 'others') {
        return address?.label?.trim() || __('Other', 'kirki-ecommerce');
      }
      return address?.label?.trim() || __('Address', 'kirki-ecommerce');
    },

    closeModal() {
      this.modalOpen = false;
      this.editingId = null;
      this.errors = {};
    },

    validateForm(): boolean {
      this.errors = {};

      const requiredRules: { field: keyof AddressFormData; message: string }[] = [
        { field: 'first_name', message: __('First name is required.', 'kirki-ecommerce') },
        { field: 'last_name', message: __('Last name is required.', 'kirki-ecommerce') },
        { field: 'country', message: __('Country is required.', 'kirki-ecommerce') },
        { field: 'address_line1', message: __('Street address is required.', 'kirki-ecommerce') },
        { field: 'city', message: __('City is required.', 'kirki-ecommerce') },
        { field: 'postal_code', message: __('Postal code is required.', 'kirki-ecommerce') },
        { field: 'phone', message: __('Phone number is required.', 'kirki-ecommerce') },
      ];

      for (const rule of requiredRules) {
        const val = this.formData[rule.field];
        if (!val || (typeof val === 'string' && val.trim() === '')) {
          this.errors[rule.field] = rule.message;
        }
      }

      if (this.availableStates.length > 0) {
        const stateVal = this.formData.state;
        if (!stateVal || (typeof stateVal === 'string' && stateVal.trim() === '')) {
          this.errors.state = __('State is required.', 'kirki-ecommerce');
        }
      }

      if (
        this.formData.phone &&
        !/^\+?(?=(?:\D*\d){7,15}\D*$)[\d\s().-]+$/.test(this.formData.phone)
      ) {
        this.errors.phone = __('Please enter a valid phone number.', 'kirki-ecommerce');
      }

      return Object.keys(this.errors).length === 0;
    },

    async saveAddress() {
      if (this.loading) {
        return;
      }

      if (!this.validateForm()) {
        return;
      }

      this.loading = true;
      this.errors = {};

      const isOther = this.formData.type === 'other';
      const label = isOther ? (this.formData.label.trim() || undefined) : undefined;

      // Backend API validates in:home,office,others
      let apiType = 'home';
      if (this.formData.type === 'work') {
        apiType = 'office';
      } else if (this.formData.type === 'other') {
        apiType = 'others';
      }

      const payload: AccountAddressPayload = {
        type: apiType,
        label,
        first_name: this.formData.first_name,
        last_name: this.formData.last_name,
        company: this.formData.company,
        country: this.formData.country,
        address_line1: this.formData.address_line1,
        address_line2: this.formData.address_line2,
        city: this.formData.city,
        state: String(this.formData.state || ''),
        postal_code: this.formData.postal_code,
        phone: this.formData.phone,
        email: this.formData.email,
        is_default_shipping: this.formData.is_default_shipping,
        is_default_billing: this.formData.is_default_billing,
      };

      try {
        if (this.isEditing && this.editingId !== null) {
          const res = await accountApi.editAddress(this.editingId, payload);
          const index = this.addresses.findIndex((a) => a.id === this.editingId);
          if (index !== -1) {
            this.addresses[index] = {
              ...this.addresses[index],
              ...payload,
              type: this.formData.type,
              label: isOther ? this.formData.label.trim() : '',
              id: this.editingId,
            };
          }

          if (payload.is_default_shipping) {
            this.addresses.forEach((a) => {
              if (a.id !== this.editingId) {
                a.is_default_shipping = false;
              }
            });
          }
          if (payload.is_default_billing) {
            this.addresses.forEach((a) => {
              if (a.id !== this.editingId) {
                a.is_default_billing = false;
              }
            });
          }

          this.closeModal();
          toastManager.success(res?.message || __('Address updated successfully.', 'kirki-ecommerce'));
        } else {
          const res = await accountApi.createAddress(payload);
          const newId = res?.data?.id ?? Date.now();
          const newAddress: AddressItem = {
            id: newId,
            ...payload,
            type: this.formData.type,
            label: isOther ? this.formData.label.trim() : '',
          };

          if (payload.is_default_shipping) {
            this.addresses.forEach((a) => {
              a.is_default_shipping = false;
            });
          }
          if (payload.is_default_billing) {
            this.addresses.forEach((a) => {
              a.is_default_billing = false;
            });
          }

          this.addresses.push(newAddress);
          this.closeModal();
          toastManager.success(res?.message || __('Address added successfully.', 'kirki-ecommerce'));
        }
      } catch (err: any) {
        if (err?.errors && typeof err.errors === 'object') {
          for (const [key, messages] of Object.entries(err.errors)) {
            const rawMsg = Array.isArray(messages) ? messages[0] : (messages as string);
            if (rawMsg) {
              this.errors[key] = rawMsg;
            }
          }
          toastManager.error(err.message || __('Validation failed!', 'kirki-ecommerce'));
          return;
        }
        const msg = err?.message || __('Failed to save address. Please try again.', 'kirki-ecommerce');
        toastManager.error(msg);
      } finally {
        this.loading = false;
      }
    },

    async deleteAddress(id: number | string) {
      this.closeMenu();

      const confirmed = window.confirm(
        __('Are you sure you want to delete this address?', 'kirki-ecommerce'),
      );
      if (!confirmed) {
        return;
      }

      this.loading = true;
      try {
        const res = await accountApi.deleteAddress(id);
        this.addresses = this.addresses.filter((a) => a.id !== id);
        toastManager.success(res?.message || __('Address deleted successfully.', 'kirki-ecommerce'));
      } catch (err: any) {
        toastManager.error(err?.message || __('Failed to delete address.', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },

    async setDefault(id: number | string, type: 'shipping' | 'billing') {
      this.closeMenu();

      this.loading = true;
      try {
        const res = await accountApi.setDefaultAddress(id, type);

        this.addresses.forEach((a) => {
          if (type === 'shipping') {
            a.is_default_shipping = a.id === id;
          } else {
            a.is_default_billing = a.id === id;
          }
        });

        toastManager.success(res?.message || __('Default address updated.', 'kirki-ecommerce'));
      } catch (err: any) {
        toastManager.error(err?.message || __('Failed to set default address.', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },
  };
}
