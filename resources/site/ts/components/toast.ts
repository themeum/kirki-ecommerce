/**
 * Alpine component: toast
 * Toast notification system with auto-dismiss and multiple variants.
 *
 * PHP usage:
 *   <div x-data="toastStore" class="kirki-toast-container">
 *     <template x-for="toast in toasts" :key="toast.id">
 *       <div x-data="toastItem(toast)" 
 *            class="kirki-toast kirki-toast-success"
 *            x-show="visible"
 *            x-transition:enter
 *            x-transition:enter-end
 *            x-transition:leave
 *            x-transition:leave-end>
 *         <div class="kirki-toast-icon">✓</div>
 *         <div class="kirki-toast-content">
 *           <div class="kirki-toast-title" x-text="toast.title"></div>
 *           <div class="kirki-toast-message" x-text="toast.message"></div>
 *         </div>
 *         <button class="kirki-toast-close" @click="dismiss">&times;</button>
 *       </div>
 *     </template>
 *   </div>
 */

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Global toast store
export function createToastStore() {
  return {
    toasts: [] as ToastItem[],

    add(toast: Omit<ToastItem, 'id'>) {
      const id = Date.now().toString();
      const newToast: ToastItem = {
        id,
        ...toast,
        duration: toast.duration ?? 5000,
      };
      this.toasts.push(newToast);
      return id;
    },

    remove(id: string) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },

    success(title: string, message: string, duration?: number) {
      return this.add({ title, message, variant: 'success', duration });
    },

    error(title: string, message: string, duration?: number) {
      return this.add({ title, message, variant: 'error', duration });
    },

    warning(title: string, message: string, duration?: number) {
      return this.add({ title, message, variant: 'warning', duration });
    },

    info(title: string, message: string, duration?: number) {
      return this.add({ title, message, variant: 'info', duration });
    },

    clear() {
      this.toasts = [];
    },
  };
}

// Individual toast item component
export function toastItem(toast: ToastItem) {
  return {
    toast,
    visible: true,
    timer: null as number | null,

    dismiss() {
      this.visible = false;
      setTimeout(() => {
        ((this as any).$store as any).toastStore.remove(this.toast.id);
      }, 200);
    },

    init() {
      // Auto-dismiss after duration
      if (this.toast.duration && this.toast.duration > 0) {
        this.timer = window.setTimeout(() => {
          this.dismiss();
        }, this.toast.duration);
      }

      // Clear timer on destroy
      (this as any).$cleanup(() => {
        if (this.timer) {
          clearTimeout(this.timer);
        }
      });
    },
  };
}
