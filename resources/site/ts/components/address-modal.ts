/**
 * Address Modal & Formatting Composable
 * Shared between Account Addresses and Checkout components
 */

import { type AccountAddressPayload, accountApi } from '../api/account';
import { toastManager } from '../services/toast/runtime';
import { config } from '../utils';
import type { CheckoutAddress } from './checkout-address';

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

export interface CountryState {
  id: string | number;
  name: string;
}

export interface CountryItem {
  code: string;
  name: string;
  states?: CountryState[];
  id?: string | number;
}

export interface AddressModalHost {
  modalOpen: boolean;
  isEditing: boolean;
  editingId: number | string | null;
  loading: boolean;
  errors: Record<string, string>;
  formData: AddressFormData;
  countries: CountryItem[];
  availableStates: CountryState[];
  hasAddresses(): boolean;
  addresses?: AddressItem[];
  savedAddresses?: AddressItem[];
  activeMenuId?: number | string | null;
  pickerPurpose?: 'shipping' | 'billing';
  selectedShippingAddressId?: number | string | null;
  tempSelectedAddressId?: number | string | null;
  getAvailableStates(): CountryState[];
  getAddressLabel(address: AddressItem): string;
  getFormattedAddressLines(address: AddressItem): string;
  getStateName(countryCode?: string, stateVal?: string | number): string;
  getCountryName(code?: string): string;
  getCityStateZip(address?: AddressItem | CheckoutAddress | null): string;
  getFormattedAddressFirstLine(address?: AddressItem | CheckoutAddress | null): string;
  getFormattedAddressSecondLine(address?: AddressItem | CheckoutAddress | null): string;
  openAddModal(): void;
  openEditModal(address: AddressItem): void;
  closeModal(): void;
  onTypeChange(): void;
  validateForm(): boolean;
  validateAddressForm(): boolean;
  saveAddress(): Promise<void>;
}

export interface AddressModalOptions {
  onSaved?: (self: AddressModalHost, address: AddressItem, isEditing: boolean) => void;
}

export function createAddressModal(options: AddressModalOptions = {}) {
  const { __ } = window.wp.i18n;
  const initialCountries = (config?.countries ?? []) as CountryItem[];

  return {
    modalOpen: false,
    isEditing: false,
    editingId: null as number | string | null,
    loading: false,
    errors: {} as Record<string, string>,
    formData: {
      type: 'home',
      label: '',
      first_name: '',
      last_name: '',
      company: '',
      country: initialCountries[0]?.code || '',
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

    getAvailableStates(this: AddressModalHost): CountryState[] {
      const countryCode = this.formData?.country;
      if (!countryCode) {
        return [];
      }
      const countriesList: CountryItem[] =
        this.countries ?? (config?.countries as CountryItem[]) ?? [];
      const country = countriesList.find(
        (c: CountryItem) => (c.code || String(c.id)) === countryCode,
      );
      return country?.states ?? [];
    },

    get availableStates(): CountryState[] {
      return (this as AddressModalHost).getAvailableStates();
    },

    hasAddresses(this: AddressModalHost): boolean {
      const addressHost = this as AddressModalHost;
      const addressList = addressHost.addresses ?? addressHost.savedAddresses ?? [];
      return addressList.length > 0;
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

    getFormattedAddressLines(address: AddressItem): string {
      if (!address) {
        return '';
      }
      return [address.address_line1, address.address_line2].filter(Boolean).join(', ');
    },

    getStateName(this: AddressModalHost, countryCode?: string, stateVal?: string | number): string {
      if (!stateVal || !countryCode) {
        return String(stateVal || '');
      }
      const countriesList: CountryItem[] =
        this.countries ?? (config?.countries as CountryItem[]) ?? [];
      const country = countriesList.find(
        (c: CountryItem) => (c.code || String(c.id)) === countryCode,
      );
      if (!country?.states) {
        return String(stateVal);
      }
      const state = country.states.find(
        (s: CountryState) => String(s.id) === String(stateVal) || s.name === String(stateVal),
      );
      return state ? state.name : String(stateVal);
    },

    getCountryName(this: AddressModalHost, code?: string): string {
      if (!code) {
        return '';
      }
      const countriesList: CountryItem[] =
        this.countries ?? (config?.countries as CountryItem[]) ?? [];
      const country = countriesList.find((c: CountryItem) => (c.code || String(c.id)) === code);
      return country ? country.name : code;
    },

    getCityStateZip(this: AddressModalHost, address?: AddressItem | CheckoutAddress | null): string {
      if (!address) {
        return '';
      }
      const state = this.getStateName(address.country, address.state);
      const parts = [address.city, state].filter(Boolean).join(', ');
      return `${parts} ${address.postal_code || ''}`.trim();
    },

    getFormattedAddressFirstLine(address?: AddressItem | CheckoutAddress | null): string {
      if (!address) {
        return '';
      }
      const fullName = `${address.first_name || ''} ${address.last_name || ''}`.trim();
      return [fullName, address.address_line1].filter(Boolean).join(', ');
    },

    getFormattedAddressSecondLine(
      this: AddressModalHost,
      address?: AddressItem | CheckoutAddress | null,
    ): string {
      if (!address) {
        return '';
      }
      const cityStateZip = this.getCityStateZip(address);
      return [address.address_line2, cityStateZip, address.phone, address.email]
        .filter(Boolean)
        .join(', ');
    },

    openAddModal(this: AddressModalHost) {
      this.isEditing = false;
      this.editingId = null;
      if ('activeMenuId' in this) {
        this.activeMenuId = null;
      }
      this.errors = {};
      const countriesList: CountryItem[] =
        this.countries ?? (config?.countries as CountryItem[]) ?? [];
      const defaultCountry = countriesList[0]?.code || '';
      const addressList = this.addresses ?? this.savedAddresses ?? [];
      const isFirst = addressList.length === 0;

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
        is_default_shipping: isFirst,
        is_default_billing: isFirst,
      };
      this.modalOpen = true;
    },

    openEditModal(this: AddressModalHost, address: AddressItem) {
      this.isEditing = true;
      this.editingId = address.id;
      if ('activeMenuId' in this) {
        this.activeMenuId = null;
      }
      this.errors = {};

      let resolvedType = (address.type || 'home').toLowerCase();
      if (resolvedType === 'office') {
        resolvedType = 'work';
      } else if (resolvedType === 'others') {
        resolvedType = 'other';
      }

      const countriesList: CountryItem[] =
        this.countries ?? (config?.countries as CountryItem[]) ?? [];
      const defaultCountry = countriesList[0]?.code || '';

      this.formData = {
        type: resolvedType,
        label: address.label || '',
        first_name: address.first_name || '',
        last_name: address.last_name || '',
        company: address.company || '',
        country: address.country || defaultCountry,
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

    closeModal(this: AddressModalHost) {
      this.modalOpen = false;
      this.editingId = null;
      this.errors = {};
    },

    onTypeChange(this: AddressModalHost) {
      delete this.errors.label;
      if (this.formData.type !== 'other') {
        this.formData.label = '';
      }
    },

    validateForm(this: AddressModalHost): boolean {
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

      const states = this.getAvailableStates();
      if (states.length > 0) {
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

    validateAddressForm(this: AddressModalHost): boolean {
      return this.validateForm();
    },

    async saveAddress(this: AddressModalHost) {
      if (this.loading) {
        return;
      }

      if (!this.validateForm()) {
        return;
      }

      this.loading = true;
      this.errors = {};

      const isOther = this.formData.type === 'other';
      const label = isOther ? this.formData.label.trim() || undefined : undefined;

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

      const addressList: AddressItem[] = this.addresses ?? this.savedAddresses ?? [];

      try {
        if (this.isEditing && this.editingId !== null) {
          const res = await accountApi.editAddress(this.editingId, payload);
          const index = addressList.findIndex((a) => String(a.id) === String(this.editingId));
          if (index !== -1) {
            addressList[index] = {
              ...addressList[index],
              ...payload,
              type: this.formData.type,
              label: isOther ? this.formData.label.trim() : '',
              id: this.editingId,
            };
          }

          if (payload.is_default_shipping) {
            addressList.forEach((a) => {
              if (String(a.id) !== String(this.editingId)) {
                a.is_default_shipping = false;
              }
            });
          }
          if (payload.is_default_billing) {
            addressList.forEach((a) => {
              if (String(a.id) !== String(this.editingId)) {
                a.is_default_billing = false;
              }
            });
          }

          this.closeModal();
          toastManager.success(
            res?.message || __('Address updated successfully.', 'kirki-ecommerce'),
          );

          if (index !== -1) {
            options.onSaved?.(this, addressList[index], true);
          }
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
            addressList.forEach((a) => {
              a.is_default_shipping = false;
            });
          }
          if (payload.is_default_billing) {
            addressList.forEach((a) => {
              a.is_default_billing = false;
            });
          }

          addressList.unshift(newAddress);
          this.closeModal();
          toastManager.success(
            res?.message || __('Address added successfully.', 'kirki-ecommerce'),
          );

          options.onSaved?.(this, newAddress, false);
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
        toastManager.error(
          err?.message || __('Failed to save address. Please try again.', 'kirki-ecommerce'),
        );
      } finally {
        this.loading = false;
      }
    },
  };
}
