/**
 * Account Dashboard Alpine Component
 * Handles resending verification email and dashboard actions
 */

import { accountApi } from '../api/account';
import { toastMeta } from './toast';

export function accountDashboard(initialCooldown = 0, initialHasSent = false) {
  const toast = toastMeta.component();

  return {
    verificationLoading: false,
    verificationSent: false,
    hasSentVerification: initialHasSent,
    cooldownRemaining: initialCooldown,
    cooldownInterval: null as ReturnType<typeof setInterval> | null,

    init() {
      if (this.cooldownRemaining > 0) {
        this.startCooldownTimer();
      }
    },

    startCooldownTimer() {
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
      }
      this.cooldownInterval = setInterval(() => {
        if (this.cooldownRemaining > 1) {
          this.cooldownRemaining--;
        } else {
          this.cooldownRemaining = 0;
          if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
          }
        }
      }, 1000);
    },

    destroy() {
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
        this.cooldownInterval = null;
      }
    },

    async resendVerificationEmail() {
      if (this.verificationLoading || this.cooldownRemaining > 0) {
        return;
      }
      this.verificationLoading = true;

      try {
        const res = await accountApi.resendVerificationEmail();
        this.verificationSent = true;
        this.hasSentVerification = true;
        this.cooldownRemaining = 120;
        this.startCooldownTimer();
        toast.success(res?.message || 'A confirmation link has been sent to your email address.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to send verification email. Please try again.');
      } finally {
        this.verificationLoading = false;
      }
    },
  };
}
