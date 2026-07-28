import { toast } from 'sonner';
import type { z } from 'zod';

import type { ApiClientResponse, ErrorResponse } from '@/libs/api';
import {
  ApiValidationError,
  formatValidationIssues,
  isApiValidationError,
} from '@/schemas/shared/errors';
import { __ } from '@/wpi18n';

const unwrapData = <T>(response: unknown): T => {
  return (response as ApiClientResponse<T>).data;
};

const unwrapResponse = <T>(response: unknown): ApiClientResponse<T> => {
  return response as ApiClientResponse<T>;
};

const reportValidationFailure = (issues: z.ZodIssue[]) => {
  const error = new ApiValidationError(issues);
  console.error(error.name, error.message, formatValidationIssues(issues));
  return error;
};

const parseData = <T extends z.ZodTypeAny>(
  schema: T,
  response: unknown,
): z.infer<T> => {
  const result = schema.safeParse(unwrapData(response));
  if (!result.success) {
    const error = reportValidationFailure(result.error.issues);
    toast.error(error.message);
    throw error;
  }
  return result.data;
};

const parseResponse = <T extends z.ZodTypeAny>(
  schema: T,
  response: unknown,
): ApiClientResponse<z.infer<T>> => {
  const envelope = unwrapResponse(response);
  const result = schema.safeParse(envelope.data);
  if (!result.success) {
    throw reportValidationFailure(result.error.issues);
  }
  return { ...envelope, data: result.data };
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
  parseResponse, toastMutationError,
  toastMutationSuccess, unwrapData,
  unwrapResponse
};
