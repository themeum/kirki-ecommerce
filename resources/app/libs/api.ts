import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { format } from 'date-fns';

import { APP_API_PREFIX } from '@/conf';
import { DATE_FORMATS } from '@/libs/date';
import { isMediaObject, isVideoObject } from '@/utils/media';
import { getObjectKeys, isDefined, isObject } from '@/utils/object';
import { __ } from '@/wpi18n';

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const apiClient = axios.create({
  baseURL: APP_API_PREFIX,
});

function processPayload(data: unknown): unknown {
  if (!isDefined(data)) {
    return null;
  }

  if (data === null || ['boolean', 'number', 'string'].includes(typeof data)) {
    if (typeof data === 'string' && !data) {
      return null;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(processPayload);
  }

  if (data instanceof Date) {
    return format(data, DATE_FORMATS.ATOM);
  }

  if (data instanceof File || data instanceof Blob || data instanceof FormData) {
    return data;
  }

  if (isMediaObject(data)) {
    if (isVideoObject(data)) {
      return {
        id: data.id,
        poster: isDefined(data.poster?.id) ? Number(data.poster.id) : null,
      };
    }
    return Number(data.id);
  }

  if (isObject(data)) {
    return getObjectKeys(data).reduce<Record<string, unknown>>((acc, key) => {
      acc[key as string] = processPayload(data[key]);
      return acc;
    }, {});
  }

  return data;
}

function prepare(config: InternalAxiosRequestConfig) {
  if (!isDefined(config.headers)) {
    config.headers = {} as AxiosRequestHeaders;
  }

  const { nonce } = window.kirki_ecommerce;

  config.headers.Accept = 'application/json';
  config.headers['Content-Type'] = 'application/json';

  if (nonce) {
    config.headers['X-WP-Nonce'] = nonce;
  }

  if (config.data) {
    config.data = processPayload(config.data);
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }

  if (!isDefined(config.params)) {
    config.params = {} as Record<string, unknown>;
  }

  config.params = {
    ...config.params,
    _method: config.method,
  } as Record<string, unknown>;

  return config;
}

apiClient.interceptors.request.use((config) => {
  return prepare(config);
});

export type ErrorResponse = AxiosError & {
  success: false;
  message: string;
  errors: Record<string, string>;
};

export type ApiClientResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

apiClient.interceptors.response.use(
  (response) => {
    if (isObject(response) && 'data' in response) {
      return response.data as AxiosResponse;
    }
    return response;
  },
  (error: unknown) => {
    if (
      isDefined(error) &&
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const errorResponse = (
        error as AxiosError<{
          success: boolean;
          message: string;
          errors: Record<string, string>;
        }>
      ).response as AxiosResponse<{
        success: boolean;
        message: string;
        errors: Record<string, string>;
      }>;

      const errorMessage =
        errorResponse?.data?.message ||
        __('Something went wrong.', 'kirki-ecommerce');

      const errors = errorResponse?.data?.errors ?? {};
      const modifiedError = {
        ...(error as object),
        success: false,
        message: errorMessage,
        errors,
        isAxiosError: true,
      } as ErrorResponse;

      return Promise.reject(modifiedError as Error);
    }

    return Promise.reject(error as Error);
  },
);

export const getErrorsObject = (
  errors?: Record<string, string[] | string> | null,
): Record<string, string> => {
  const obj: Record<string, string> = {};
  if (!errors) {
    return obj;
  }
  Object.keys(errors).forEach((key) => {
    const value = errors[key];
    obj[key] = Array.isArray(value) ? value[0] : value;
  });
  return obj;
};

export { apiClient };
