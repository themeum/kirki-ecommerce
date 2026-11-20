import type { z } from 'zod';

import { toast } from '@/components/ui/toast/toast';
import type { ApiClientResponse, ErrorResponse } from '@/libs/api';
import {
  ApiEnvelopeSchema,
  type MessageResponse,
  MessageResponseSchema,
} from '@/schemas/shared/api';
import {
  ApiValidationError,
  formatValidationIssues,
  isApiValidationError,
} from '@/schemas/shared/errors';
import { __, sprintf } from '@/wpi18n';

const unwrapData = <T>(response: unknown): T => {
  return (response as ApiClientResponse<T>).data;
};

const unwrapResponse = <T>(response: unknown): ApiClientResponse<T> => {
  return response as ApiClientResponse<T>;
};

/**
 * Unwrap a list endpoint whose payload is typed as an array.
 *
 * PHP associative arrays serialise to JSON objects rather than arrays, so an
 * endpoint that loses its integer keys returns `{"stripe": {...}}` where the
 * client expects `[{...}]`. Callers then hit `.map is not a function` and the
 * page dies, so coerce back to an array instead of trusting the shape.
 */
const unwrapDataList = <T>(response: unknown): T[] => {
  const data = unwrapData<T[] | Record<string, T> | null>(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    return Object.values(data);
  }

  return [];
};

const reportValidationFailure = (issues: z.ZodIssue[]) => {
  const error = new ApiValidationError(issues);
  console.error(error.name, error.message, formatValidationIssues(issues));
  return error;
};

/**
 * Queries have no `onError` callback in React Query v5, so `parseData`
 * toasts directly — it's the only chance a query-time mismatch has to reach
 * the user. Mutations still have `onError`, so `parseResponse`/`parseMessage`
 * only throw and let the mutation's own `onError` (or, for product forms,
 * the page-level catch in `product-form.tsx`) report it — toasting here too
 * would double the message.
 */
const parseData = <TOutput, TInput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  response: unknown,
): TOutput => {
  const envelope = ApiEnvelopeSchema.safeParse(response);
  if (!envelope.success) {
    const error = reportValidationFailure(envelope.error.issues);
    toast.error(error.message);
    throw error;
  }

  const result = schema.safeParse(envelope.data.data);
  if (!result.success) {
    const error = reportValidationFailure(result.error.issues);
    toast.error(error.message);
    throw error;
  }
  return result.data;
};

const parseResponse = <TOutput, TInput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  response: unknown,
): ApiClientResponse<TOutput> => {
  const envelope = ApiEnvelopeSchema.safeParse(response);
  if (!envelope.success) {
    throw reportValidationFailure(envelope.error.issues);
  }

  const result = schema.safeParse(envelope.data.data);
  if (!result.success) {
    throw reportValidationFailure(result.error.issues);
  }
  return { ...(envelope.data as ApiClientResponse<unknown>), data: result.data };
};

const parseMessage = (response: unknown): MessageResponse => {
  const result = MessageResponseSchema.safeParse(response);
  if (!result.success) {
    throw reportValidationFailure(result.error.issues);
  }
  return result.data;
};

const getErrorMessage = (error: unknown) => {
  if (isApiValidationError(error)) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as ErrorResponse).message === 'string'
  ) {
    return (error as ErrorResponse).message;
  }
  return __('Something went wrong.', 'kirki-ecommerce');
};

const toastMutationError = (error: unknown) => {
  toast.error(getErrorMessage(error));
};

const toastMutationSuccess = (message?: string, options?: { description?: string }) => {
  if (!message) {
    return;
  }
  toast.success(message, options);
};

type ItemAction =
  | 'activated'
  | 'deactivated'
  | 'enabled'
  | 'disabled'
  | 'deleted'
  | 'deleted-permanently'
  | 'removed'
  | 'duplicated'
  | 'restored'
  | 'moved-to-trash'
  | 'set-as-default'
  | 'removed-as-default';

const getItemActionFormat = (action: ItemAction) => {
  switch (action) {
    case 'activated':
      /* translators: %s: item name */
      return __('"%s" activated', 'kirki-ecommerce');
    case 'deactivated':
      /* translators: %s: item name */
      return __('"%s" deactivated', 'kirki-ecommerce');
    case 'enabled':
      /* translators: %s: item name */
      return __('"%s" enabled', 'kirki-ecommerce');
    case 'disabled':
      /* translators: %s: item name */
      return __('"%s" disabled', 'kirki-ecommerce');
    case 'deleted':
      /* translators: %s: item name */
      return __('"%s" deleted', 'kirki-ecommerce');
    case 'deleted-permanently':
      /* translators: %s: item name */
      return __('"%s" deleted permanently', 'kirki-ecommerce');
    case 'removed':
      /* translators: %s: item name */
      return __('"%s" removed', 'kirki-ecommerce');
    case 'duplicated':
      /* translators: %s: item name */
      return __('"%s" duplicated', 'kirki-ecommerce');
    case 'restored':
      /* translators: %s: item name */
      return __('"%s" restored', 'kirki-ecommerce');
    case 'moved-to-trash':
      /* translators: %s: item name */
      return __('"%s" moved to trash', 'kirki-ecommerce');
    case 'set-as-default':
      /* translators: %s: item name */
      return __('"%s" set as default', 'kirki-ecommerce');
    case 'removed-as-default':
      /* translators: %s: item name */
      return __('"%s" removed as default', 'kirki-ecommerce');
  }
};

type NamedItemVariables<TId> = { id: TId; name?: string | null };

const getItemActionMessage = (action: ItemAction, name?: string | null) => {
  const itemName = name?.trim();
  if (!itemName) {
    return undefined;
  }
  return sprintf(getItemActionFormat(action), itemName);
};

export {
  getErrorMessage,
  getItemActionMessage,
  parseData,
  parseMessage,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapDataList,
  unwrapResponse,
};

export type { NamedItemVariables };
