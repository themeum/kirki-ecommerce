/**
 * Account Addresses Alpine Component
 * Handles viewing, adding, editing, deleting, and setting default addresses via REST API
 */

import { accountApi } from '../api/account';
import { toastManager } from '../services/toast/runtime';
import { config } from '../utils';
import {
  type AddressFormData,
  type AddressItem,
  type AddressModalHost,
  type CountryItem,
  type CountryState,
  createAddressModal,
} from './address-modal';

export type { AddressFormData, AddressItem };

export interface AccountAddressesComponent extends AddressModalHost {
  addresses: AddressItem[];
  countries: CountryItem[];
  activeMenuId: number | string | null;
  deleteModalOpen: boolean;
  pendingDeleteId: number | string | null;
  toggleMenu(id: number | string): void;
  closeMenu(): void;
  deleteAddress(id: number | string): void;
  cancelDelete(): void;
  confirmDelete(): Promise<void>;
  setDefault(id: number | string, purpose: 'shipping' | 'billing'): Promise<void>;
}

export function accountAddresses(): AccountAddressesComponent {
  const { __ } = window.wp.i18n;

  return {
    addresses: config?.addresses ?? [],
    countries: config?.countries ?? [],
    activeMenuId: null as number | string | null,
    deleteModalOpen: false,
    pendingDeleteId: null as number | string | null,

    // Shared address modal state, helpers, and handlers
    ...createAddressModal(),

    get availableStates(): CountryState[] {
      return (this as any).getAvailableStates();
    },

    toggleMenu(this: AccountAddressesComponent, id: number | string) {
      this.activeMenuId = this.activeMenuId === id ? null : id;
    },

    closeMenu(this: AccountAddressesComponent) {
      this.activeMenuId = null;
    },

    deleteAddress(this: AccountAddressesComponent, id: number | string) {
      this.closeMenu();
      this.pendingDeleteId = id;
      this.deleteModalOpen = true;
    },

    cancelDelete(this: AccountAddressesComponent) {
      this.deleteModalOpen = false;
      this.pendingDeleteId = null;
    },

    async confirmDelete(this: AccountAddressesComponent) {
      if (!this.pendingDeleteId) {
        return;
      }
      const id = this.pendingDeleteId;

      this.loading = true;
      try {
        const res = await accountApi.deleteAddress(id);
        this.addresses = this.addresses.filter((a) => a.id !== id);
        toastManager.success(
          res?.message || __('Address deleted successfully.', 'kirki-ecommerce'),
        );
        this.cancelDelete();
      } catch (err: any) {
        toastManager.error(err?.message || __('Failed to delete address.', 'kirki-ecommerce'));
      } finally {
        this.loading = false;
      }
    },

    async setDefault(
      this: AccountAddressesComponent,
      id: number | string,
      purpose: 'shipping' | 'billing',
    ) {
      this.closeMenu();

      this.loading = true;
      try {
        const res = await accountApi.setDefaultAddress(id, purpose);

        this.addresses.forEach((a) => {
          if (purpose === 'shipping') {
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
