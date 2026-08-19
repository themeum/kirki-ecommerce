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
  const toast = toastMeta.component();

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
      if (this.passwordLoading) {return;}
      this.passwordModalOpen = false;
    },

    async saveProfile() {
      if (this.profileLoading) {return;}
      this.profileLoading = true;

      try {
        const payload: ProfilePayload = {
          first_name: this.profileData.first_name,
          last_name: this.profileData.last_name,
        };

        const res = await accountApi.updateProfile(payload);
        toast.success(res?.message || 'Account details saved successfully.');
      } catch (err: any) {
        const msg = err?.message || 'Failed to save account details. Please try again.';
        toast.error(msg);
      } finally {
        this.profileLoading = false;
      }
    },

    async updatePassword(values: Record<string, unknown>, resetForm?: () => void) {
      if (this.passwordLoading) {return;}
      this.passwordLoading = true;

      try {
        const payload: PasswordChangePayload = {
          current_password: String(values.current_password || ''),
          password: String(values.password || ''),
          password_confirmation: String(values.password_confirmation || ''),
        };

        const res = await accountApi.changePassword(payload);
        toast.success(res?.message || 'Password updated successfully.');
        resetForm?.();
        this.closePasswordModal();
      } catch (err: any) {
        const msg =
          err?.message || 'Failed to update password. Please check your current password.';
        toast.error(msg);
      } finally {
        this.passwordLoading = false;
      }
    },
  };
}
