import { toast } from 'sonner';
import type { z } from 'zod';

import type { ApiClientResponse, ErrorResponse } from '@/libs/api';
import { ApiEnvelopeSchema, type MessageResponse, MessageResponseSchema } from '@/schemas/shared/api';
import { ApiValidationError, formatValidationIssues, isApiValidationError } from '@/schemas/shared/errors';
import { __ } from '@/wpi18n';

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

const toastMutationSuccess = (message?: string) => {
  if (!message) {
    return;
  }
  toast.success(message);
};

export {
  getErrorMessage, parseData,
  parseMessage, parseResponse, toastMutationError,
  toastMutationSuccess, unwrapData,
  unwrapDataList,
  unwrapResponse,
};
