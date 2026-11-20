import type { ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';

import ToastCard from '@/components/ui/toast/toast-card';
import type {
  ToastContent,
  ToastId,
  ToastOptions,
  ToastPatch,
  ToastState,
  ToastVariant,
} from '@/components/ui/toast/toast-types';

type ToastPromiseContent<TValue> = ToastContent | ((value: TValue) => ToastContent);

type ToastPromiseMessages<TValue> = {
  loading: ToastContent & { variant?: ToastVariant };
  success: ToastPromiseContent<TValue>;
  error: ToastPromiseContent<unknown>;
};

const toastStates = new Map<ToastId, ToastState>();
let toastCounter = 0;

const createId = (): ToastId => {
  toastCounter += 1;

  return `kirki-ecommerce-toast-${toastCounter}`;
};

const isThenable = (value: unknown): value is PromiseLike<unknown> => {
  return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';
};

const resolveContent = <TValue,>(content: ToastPromiseContent<TValue>, value: TValue) => {
  const resolved = typeof content === 'function' ? content(value) : content;

  return { title: resolved.title, description: resolved.description };
};

const forget = (id: ToastId) => {
  toastStates.delete(id);
};

const dismiss = (id?: ToastId) => {
  if (id === undefined) {
    toastStates.clear();
    sonnerToast.dismiss();
    return;
  }

  forget(id);
  sonnerToast.dismiss(id);
};

const draw = (state: ToastState) => {
  toastStates.set(state.id, state);

  sonnerToast.custom(
    () => (
      <ToastCard
        toast={state}
        onClose={() => dismiss(state.id)}
        onExpire={() => dismiss(state.id)}
        onUndo={() => runUndo(state.id)}
        onRetry={() => runRetry(state.id)}
      />
    ),
    {
      id: state.id,
      duration: Infinity,
      onDismiss: () => forget(state.id),
      onAutoClose: () => forget(state.id),
    },
  );
};

const update = (id: ToastId, patch: ToastPatch) => {
  const current = toastStates.get(id);

  if (!current) {
    return;
  }

  draw({ ...current, ...patch, id, revision: current.revision + 1 });
};

const show = (variant: ToastVariant, title: ReactNode, options: ToastOptions = {}): ToastId => {
  const id = options.id ?? createId();
  const previous = toastStates.get(id);

  draw({
    id,
    variant,
    title,
    description: options.description,
    duration: options.duration,
    loading: options.loading ?? false,
    undo: options.undo,
    retry: options.retry,
    revision: previous ? previous.revision + 1 : 0,
  });

  return id;
};

const runUndo = (id: ToastId) => {
  const current = toastStates.get(id);

  if (!current?.undo) {
    return;
  }

  current.undo.onUndo();
  dismiss(id);
};

const runRetry = (id: ToastId) => {
  const current = toastStates.get(id);

  if (!current?.retry) {
    return;
  }

  const { retry } = current;
  const result = retry.onRetry();

  if (!isThenable(result)) {
    dismiss(id);
    return;
  }

  update(id, { loading: true });

  Promise.resolve(result).then(
    () => {
      if (!retry.success) {
        dismiss(id);
        return;
      }

      update(id, {
        variant: 'success',
        title: retry.success.title,
        description: retry.success.description,
        duration: undefined,
        loading: false,
        undo: undefined,
        retry: undefined,
      });
    },
    () => {
      update(id, {
        variant: current.variant,
        title: current.title,
        description: current.description,
        duration: current.duration,
        loading: current.loading,
        undo: current.undo,
        retry: current.retry,
      });
    },
  );
};

const promise = <TValue,>(
  work: PromiseLike<TValue>,
  messages: ToastPromiseMessages<TValue>,
): ToastId => {
  const { variant = 'info', title, description } = messages.loading;
  const id = show(variant, title, { description, loading: true });

  Promise.resolve(work).then(
    (value) => {
      update(id, {
        variant: 'success',
        ...resolveContent(messages.success, value),
        loading: false,
      });
    },
    (error: unknown) => {
      update(id, {
        variant: 'error',
        ...resolveContent(messages.error, error),
        loading: false,
      });
    },
  );

  return id;
};

const toast = {
  success: (title: ReactNode, options?: ToastOptions) => show('success', title, options),
  info: (title: ReactNode, options?: ToastOptions) => show('info', title, options),
  warning: (title: ReactNode, options?: ToastOptions) => show('warning', title, options),
  error: (title: ReactNode, options?: ToastOptions) => show('error', title, options),
  update,
  dismiss,
  promise,
};

export { toast };
export type { ToastContent, ToastId, ToastOptions, ToastPatch, ToastPromiseMessages, ToastVariant };
