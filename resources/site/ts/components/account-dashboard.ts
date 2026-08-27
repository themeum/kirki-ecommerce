/**
 * Account Dashboard Alpine Component
 * Handles resending verification email and dashboard actions
 */

import { accountApi } from '../api/account';
import { toastMeta } from './toast';

export function accountDashboard() {
  const toast = toastMeta.component();

  return {
    verificationLoading: false,
    verificationSent: false,

    async resendVerificationEmail() {
      if (this.verificationLoading) {
        return;
      }
      this.verificationLoading = true;

      try {
        const res = await accountApi.resendVerificationEmail();
        this.verificationSent = true;
        toast.success(res?.message || 'Verification email sent successfully.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to send verification email. Please try again.');
      } finally {
        this.verificationLoading = false;
      }
    },
  };
}
