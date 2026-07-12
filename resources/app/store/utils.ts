import type { AxiosRequestConfig } from 'axios';
import type { PayloadAction } from '@reduxjs/toolkit';

import { APP_API_PREFIX } from '@/conf';
import type { ListQueryParams, SetKeyValuePayload } from '@/types';

type RequestParams = ListQueryParams & {
  category_ids?: number[];
  brand_ids?: number[];
  collection_ids?: number[];
  tag_ids?: number[];
  status?: string | string[];
  stock_status?: string;
  id?: number | string;
};

type RequestData = object;

type ValidationErrors = Record<string, string[]>;

type NestedRecord = {
  [key: string]: NestedRecord | string | number | boolean | null | undefined | object;
  page?: number;
};

const defaultGetParams: RequestParams = {
  search: '',
  sort_by: 'name',
  sort_order: 'asc',
  page: 1,
  limit: 10,
};

const defaultPutData: RequestData = {
  name: 'Test Category',
  slug: 'test-category',
  is_active: false,
};

export const getOptions = (
  endpoint = '/categories',
  params: RequestParams = defaultGetParams,
): AxiosRequestConfig => {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: APP_API_PREFIX + endpoint,
    headers: {
      'X-WP-Nonce': window.kirki_ecommerce.nonce,
    },
    params: params,
  };

  return options;
};

export const postOptions = (
  endpoint = '/categories',
  params?: unknown,
): AxiosRequestConfig => {
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: APP_API_PREFIX + endpoint,
    headers: {
      'content-type': 'application/json',
      'X-WP-Nonce': window.kirki_ecommerce.nonce,
    },
    data: params,
  };

  return options;
};

export const putOptions = (
  endpoint = '/categories/1',
  data: RequestData = defaultPutData,
): AxiosRequestConfig => {
  const options: AxiosRequestConfig = {
    method: 'PUT',
    url: APP_API_PREFIX + endpoint,
    headers: {
      'X-WP-Nonce': window.kirki_ecommerce.nonce,
    },
    data: data,
  };

  return options;
};

export const patchOptions = (
  endpoint = '/categories/1',
  data: RequestData = defaultPutData,
): AxiosRequestConfig => {
  const options: AxiosRequestConfig = {
    method: 'PATCH',
    url: APP_API_PREFIX + endpoint,
    headers: {
      'X-WP-Nonce': window.kirki_ecommerce.nonce,
    },
    data: data,
  };

  return options;
};

export const deleteOptions = (
  endpoint = '/categories/1',
): AxiosRequestConfig => {
  const options: AxiosRequestConfig = {
    method: 'DELETE',
    url: APP_API_PREFIX + endpoint,
    headers: {
      'X-WP-Nonce': window.kirki_ecommerce.nonce,
    },
  };
  return options;
};

export const getErrorsObject = (
  errors?: ValidationErrors | null,
): Record<string, string> => {
  const obj: Record<string, string> = {};
  if (!errors) {
    return obj;
  }
  Object.keys(errors).forEach((key) => {
    obj[key] = errors[key][0];
  });

  return obj;
};

export const commonActions = {
  setKeyValue: (
    state: NestedRecord,
    action: PayloadAction<SetKeyValuePayload>,
  ) => {
    const { key, value, nestedToggler } = action.payload;
    let current: NestedRecord = state;

    if (nestedToggler?.length) {
      nestedToggler.forEach((pathKey) => {
        current = current[pathKey] as NestedRecord;
      });
    }

    if (['search', 'sort_by', 'sort_order', 'page'].includes(key)) {
      current.page = 1;
    }

    current[key] = value;
  },
};
