import type { ReactNode } from 'react';

import type { ToastVariant } from '@/components/ui/toast/toast-types';

type ToastTiming = {
  defaultMs: number;
  maxMs: number;
};

type ToastDurationInput = {
  variant: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
  duration?: number;
  loading?: boolean;
  hasUndo?: boolean;
};

const BASE_READING_MS = 1500;
const READING_MS_PER_WORD = 250;
const ERROR_DURATION_MS = 20000;

const VARIANT_TIMING: Record<Exclude<ToastVariant, 'error'>, ToastTiming> = {
  success: { defaultMs: 4000, maxMs: 6000 },
  info: { defaultMs: 5000, maxMs: 8000 },
  warning: { defaultMs: 7000, maxMs: 10000 },
};

const UNDO_TIMING: ToastTiming = { defaultMs: 8000, maxMs: 10000 };

const textOf = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  return '';
};

const countWords = (...nodes: ReactNode[]): number => {
  return nodes.map(textOf).join(' ').trim().split(/\s+/).filter(Boolean).length;
};

const getToastDuration = (input: ToastDurationInput): number | null => {
  if (input.loading) {
    return null;
  }

  if (input.duration !== undefined) {
    return input.duration;
  }

  if (input.variant === 'error') {
    return ERROR_DURATION_MS;
  }

  const timing = input.hasUndo ? UNDO_TIMING : VARIANT_TIMING[input.variant];
  const readingMs =
    BASE_READING_MS + READING_MS_PER_WORD * countWords(input.title, input.description);

  return Math.min(timing.maxMs, Math.max(timing.defaultMs, readingMs));
};

export { getToastDuration };
export type { ToastDurationInput };
