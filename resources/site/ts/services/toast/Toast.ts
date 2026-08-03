import { toastManager } from './runtime';
import { type ToastConfig, type ToastOptions } from '../../types';

export class ToastService {
  show(message: string, config: ToastOptions = {}): string {
    return toastManager.show(message, config);
  }

  success(message: string, duration?: number): string {
    return toastManager.success(message, duration);
  }

  error(message: string, duration?: number): string {
    return toastManager.error(message, duration);
  }

  warning(message: string, duration?: number): string {
    return toastManager.warning(message, duration);
  }

  info(message: string, duration?: number): string {
    return toastManager.info(message, duration);
  }

  dismiss(id?: string): void {
    toastManager.dismiss(id);
  }

  clear(): void {
    toastManager.clear();
  }

  configure(options: ToastConfig): void {
    toastManager.configure(options);
  }
}

export const toastServiceMeta = {
  name: 'toast',
  instance: new ToastService(),
};
