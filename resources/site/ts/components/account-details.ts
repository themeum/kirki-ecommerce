/**
 * Account Details Alpine Component
 * Handles saving profile (/account/profile) and changing password via modal (/account/password-change)
 */

import { accountApi, type PasswordChangePayload, type ProfilePayload } from '../api/account';
import { toastMeta } from './toast';

export interface AccountDetailsConfig {
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export function accountDetails(config: AccountDetailsConfig) {
  const { __ } = window.wp.i18n;
  const toast = toastMeta.component();

  // Map API field names to human-readable labels for error messages
  const fieldLabels: Record<string, string> = {
    first_name: __('first name', 'kirki-ecommerce'),
    last_name: __('last name', 'kirki-ecommerce'),
    email: __('email address', 'kirki-ecommerce'),
  };

  function humanizeFieldError(rawMessage: string, fieldName: string): string {
    const label = fieldLabels[fieldName] ?? fieldName.replace(/_/g, ' ');
    return rawMessage.replace(new RegExp(`\\b${fieldName}\\b`, 'g'), label);
  }

  return {
    profileData: {
      first_name: config.user?.first_name || '',
      last_name: config.user?.last_name || '',
      email: config.user?.email || '',
    },
    profileLoading: false,

    // Password Modal State
    passwordModalOpen: false,
    passwordLoading: false,
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,

    openPasswordModal() {
      this.passwordModalOpen = true;
      this.showCurrentPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    },

    closePasswordModal() {
      if (this.passwordLoading) {
        return;
      }
      this.passwordModalOpen = false;
    },

    async saveProfile(
      values?: Record<string, string>,
      setFieldError?: (field: string, message: string) => void,
    ) {
      if (this.profileLoading) {
        return;
      }
      this.profileLoading = true;

      try {
        const firstName = values?.first_name ?? this.profileData.first_name;
        const lastName = values?.last_name ?? this.profileData.last_name;

        const payload: ProfilePayload = {
          first_name: firstName,
          last_name: lastName,
        };

        const res = await accountApi.updateProfile(payload);
        this.profileData.first_name = payload.first_name || '';
        this.profileData.last_name = payload.last_name || '';
        toast.success(res?.message || 'Account details saved successfully.');
      } catch (err: any) {
        if (err?.errors && typeof err.errors === 'object') {
          let hasFieldErrors = false;
          for (const [key, messages] of Object.entries(err.errors)) {
            const rawMsg = Array.isArray(messages) ? messages[0] : (messages as string);
            if (rawMsg) {
              const cleanMsg = humanizeFieldError(rawMsg, key);
              setFieldError?.(key, cleanMsg);
              hasFieldErrors = true;
            }
          }
          if (hasFieldErrors) {
            toast.error(err.message || 'Validation failed!');
            return;
          }
        }
        const msg = err?.message || 'Failed to save account details. Please try again.';
        toast.error(msg);
      } finally {
        this.profileLoading = false;
      }
    },

    async updatePassword(
      values: Record<string, string>,
      resetForm?: () => void,
      setFieldError?: (field: string, message: string) => void,
    ) {
      if (this.passwordLoading) {
        return;
      }
      this.passwordLoading = true;

      try {
        const payload: PasswordChangePayload = {
          current_password: values.current_password || '',
          new_password: values.new_password || '',
          new_password_confirmation: values.new_password_confirmation || '',
        };

        const res = await accountApi.changePassword(payload);
        toast.success(res?.message || 'Password updated successfully.');
        resetForm?.();
        this.closePasswordModal();
      } catch (err: any) {
        if (err?.errors && typeof err.errors === 'object') {
          let hasFieldErrors = false;
          for (const [key, messages] of Object.entries(err.errors)) {
            const rawMsg = Array.isArray(messages) ? messages[0] : (messages as string);
            if (rawMsg) {
              setFieldError?.(key, rawMsg);
              hasFieldErrors = true;
            }
          }
          if (hasFieldErrors) {
            toast.error(err.message || 'Validation failed!');
            return;
          }
        }
        const msg =
          err?.message || 'Failed to update password. Please check your current password.';
        toast.error(msg);
      } finally {
        this.passwordLoading = false;
      }
    },
  };
}
