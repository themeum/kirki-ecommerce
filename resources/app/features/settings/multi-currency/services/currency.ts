import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { currencyKeys } from '@/features/settings';
import {
  type CurrencyDraft,
  CurrencyExchangeProviderSchema,
  CurrencyOptionSchema,
  CurrencySchema,
} from '@/features/settings/multi-currency/schemas/catalog/currency';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema, ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

/**
 * `createCurrency`/`updateCurrency` both send `{ items }` to the same bulk
 * endpoint — the request docs (`currencies/create-1.yml`, `edit-1.yml`) show
 * identical bodies for POST and PUT, differing only in whether `id` is
 * present per item, which `CurrencyDraftSchema` already allows either way.
 */
type CurrencyBulkPayload = { items: CurrencyDraft[] };

const getAvailableCurrencies = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.CURRENCIES, { params })
    .then((response) => parseData(PaginatedDataSchema(CurrencySchema), response));
  return data.results;
};

const getAllCurrencies = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.CURRENCIES_LIST, { params })
    .then((response) => parseData(ResourceCollectionSchema(CurrencyOptionSchema), response));
};

const getCurrencyExchangeProviders = () => {
  return apiClient
    .get(endpoints.CURRENCY_EXCHANGE_PROVIDERS)
    .then((response) => parseData(ResourceCollectionSchema(CurrencyExchangeProviderSchema), response));
};

const createCurrency = (data: CurrencyBulkPayload) => {
  return apiClient
    .post(endpoints.CURRENCIES, data)
    .then((response) => parseResponse(ResourceCollectionSchema(CurrencySchema), response));
};

const updateCurrency = (data: CurrencyBulkPayload) => {
  return apiClient
    .put(endpoints.CURRENCIES, data)
    .then((response) => parseResponse(ResourceCollectionSchema(CurrencySchema), response));
};

const deleteCurrency = (id: number) => {
  return apiClient
    .delete(endpoints.CURRENCY(id))
    .then((response) => parseMessage(response));
};

const useAvailableCurrenciesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: currencyKeys.list(params),
    queryFn: () => getAvailableCurrencies(params),
    placeholderData: keepPreviousData,
  });
};

const useAllCurrenciesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: currencyKeys.options(params),
    queryFn: () => getAllCurrencies(params),
    placeholderData: keepPreviousData,
  });
};

const useCurrencyExchangeProvidersQuery = () => {
  return useQuery({
    queryKey: currencyKeys.exchangeProviders(),
    queryFn: getCurrencyExchangeProviders,
  });
};

const useCreateCurrencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCurrency,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Currency created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: currencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: currencyKeys.optionsAll });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateCurrencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrency,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Currency updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: currencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: currencyKeys.optionsAll });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteCurrencyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCurrency,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Currency deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: currencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: currencyKeys.optionsAll });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  createCurrency, type CurrencyBulkPayload,
deleteCurrency, getAllCurrencies, getAvailableCurrencies, getCurrencyExchangeProviders, updateCurrency, useAllCurrenciesQuery, useAvailableCurrenciesQuery, useCreateCurrencyMutation, useCurrencyExchangeProvidersQuery, useDeleteCurrencyMutation, useUpdateCurrencyMutation};

