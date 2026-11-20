import type { ToastVariant } from '@/components/ui/toast/toast-types';
import { theme } from '@/theme';

const toastVariantColor: Record<ToastVariant, string> = {
  success: theme.colors.icon.success,
  info: theme.colors.icon.brand,
  warning: theme.colors.icon.warning,
  error: theme.colors.icon.critical,
};

export { toastVariantColor };
