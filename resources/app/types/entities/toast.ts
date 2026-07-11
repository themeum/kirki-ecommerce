type ToastVariant = string;

type Toast = {
  id: string;
  title: string;
  variant: ToastVariant;
  duration: number;
  undoAction?: () => void;
  onSuccess?: () => Promise<void>;
};

type ShowToastPayload = {
  title: string;
  variant?: ToastVariant;
  duration?: number;
  undoAction?: () => void;
  onSuccess?: () => Promise<void>;
};

export type { Toast, ToastVariant, ShowToastPayload };
