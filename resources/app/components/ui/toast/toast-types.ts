import type { ReactNode } from 'react';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

type ToastContent = {
  title: ReactNode;
  description?: ReactNode;
};

type ToastUndoAction = {
  onUndo: () => void;
  label?: string;
};

type ToastRetryAction = {
  onRetry: () => void | PromiseLike<unknown>;
  success?: ToastContent;
  label?: string;
};

type ToastOptions = {
  id?: string | number;
  description?: ReactNode;
  duration?: number;
  loading?: boolean;
  undo?: ToastUndoAction;
  retry?: ToastRetryAction;
};

type ToastId = string | number;

type ToastState = ToastContent & {
  id: ToastId;
  variant: ToastVariant;
  duration?: number;
  loading: boolean;
  undo?: ToastUndoAction;
  retry?: ToastRetryAction;
  revision: number;
};

type ToastPatch = Partial<Omit<ToastState, 'id' | 'revision'>>;

export type {
  ToastContent,
  ToastId,
  ToastOptions,
  ToastPatch,
  ToastRetryAction,
  ToastState,
  ToastUndoAction,
  ToastVariant,
};
