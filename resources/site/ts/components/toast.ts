import { toastServiceMeta } from '../services/toast/Toast';
import { type ToastConfig, type ToastOptions } from '../types';

const toast = () => {
  return {
    show(message: string, config: ToastOptions = {}): string {
      return toastServiceMeta.instance.show(message, config);
    },

    remove(id: string): void {
      toastServiceMeta.instance.dismiss(id);
    },

    clear(): void {
      toastServiceMeta.instance.clear();
    },

    dismiss(id?: string): void {
      toastServiceMeta.instance.dismiss(id);
    },

    success(message: string, duration?: number): string {
      return toastServiceMeta.instance.success(message, duration);
    },

    error(message: string, duration?: number): string {
      return toastServiceMeta.instance.error(message, duration);
    },

    warning(message: string, duration?: number): string {
      return toastServiceMeta.instance.warning(message, duration);
    },

    info(message: string, duration?: number): string {
      return toastServiceMeta.instance.info(message, duration);
    },

    action(message: string, duration?: number, options?: ToastOptions): string {
      return toastServiceMeta.instance.action(message, duration, options);
    },

    configure(options: ToastConfig): void {
      toastServiceMeta.instance.configure(options);
    },
  };
};

export const toastMeta = {
  name: 'toast',
  component: toast,
};
