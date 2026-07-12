import { toast } from 'sonner';

import type { ApiClientResponse, ErrorResponse } from '@/libs/api';
import { __ } from '@/wpi18n';

const unwrapData = <T>(response: unknown): T => {
  return (response as ApiClientResponse<T>).data;
};

const unwrapResponse = <T>(response: unknown): ApiClientResponse<T> => {
  return response as ApiClientResponse<T>;
};

const getErrorMessage = (error: unknown) => {
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
  unwrapData,
  unwrapResponse,
  getErrorMessage,
  toastMutationError,
  toastMutationSuccess,
};
