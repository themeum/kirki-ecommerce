import axios, {
  type AxiosError,
  type AxiosRequestHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { APP_API_PREFIX } from '@/conf';
import { isMediaObject } from '@/utils/media';
import { getObjectKeys, isDefined, isObject } from '@/utils/object';
import { __ } from '@/wpi18n';

axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const apiClient = axios.create({
  baseURL: APP_API_PREFIX,
});

/**
 * Dev-only tripwire. Every form schema's `.transform()` is now the single
 * place responsible for shaping its request body — collapsing media objects
 * via `mediaId()`, stringifying dates via `dateString()`, and emitting
 * explicit `null` instead of `''`. This walks an outgoing payload and warns
 * when it still carries one of those raw shapes, which means some schema
 * forgot to do that work itself.
 */
function warnOnUnshapedPayload(data: unknown, path: string[] = []): void {
  if (data === null || data === undefined || typeof data !== 'object') {
    if (typeof data === 'string' && data === '') {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] outgoing payload at "${path.length ? path.join('.') : '(root)'}" is an empty string — the form schema's transform should emit null explicitly instead.`,
      );
    }
    return;
  }

  if (data instanceof Date) {
    // eslint-disable-next-line no-console
    console.warn(
      `[api] outgoing payload at "${path.length ? path.join('.') : '(root)'}" is a raw Date — the form schema's transform should convert it with dateString().`,
      data,
    );
    return;
  }

  if (data instanceof File || data instanceof Blob || data instanceof FormData) {
    return;
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => warnOnUnshapedPayload(item, [...path, String(index)]));
    return;
  }

  if (isMediaObject(data)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[api] outgoing payload at "${path.length ? path.join('.') : '(root)'}" is a raw media object — the form schema's transform should collapse it with mediaId().`,
      data,
    );
    return;
  }

  if (isObject(data)) {
    getObjectKeys(data).forEach((key) => {
      warnOnUnshapedPayload(data[key], [...path, String(key)]);
    });
  }
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

  if (config.data && import.meta.env.DEV) {
    warnOnUnshapedPayload(config.data);
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
