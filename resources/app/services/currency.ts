import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { toastMutationError, toastMutationSuccess, unwrapData, unwrapResponse } from '@/services/helpers';
import type { ListQueryParams, Currency, CurrencyFormData, PaginatedData } from '@/types';
import { __ } from '@/wpi18n';

const getAvailableCurrencies = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.CURRENCIES, { params })
    .then((response) => unwrapData<PaginatedData<Currency>>(response));
  return data.results;
};

const getAllCurrencies = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.CURRENCIES_LIST, { params })
    .then((response) => unwrapData<Currency[]>(response));
};

const getCurrencyExchangeProviders = () => {
  return apiClient
    .get(endpoints.CURRENCY_EXCHANGE_PROVIDERS)
    .then((response) => unwrapData(response));
};

const createCurrency = (data: CurrencyFormData) => {
  return apiClient
    .post(endpoints.CURRENCIES, data)
    .then((response) => unwrapResponse<Currency>(response));
};

const updateCurrency = (data: CurrencyFormData) => {
  return apiClient
    .put(endpoints.CURRENCIES, data)
    .then((response) => unwrapResponse(response));
};

const deleteCurrency = (id: number) => {
  return apiClient
    .delete(endpoints.CURRENCY(id))
    .then((response) => unwrapResponse(response));
};

const useAvailableCurrenciesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Currencies(params),
    queryFn: () => getAvailableCurrencies(params),
    placeholderData: keepPreviousData,
  });
};

const useAllCurrenciesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.CurrenciesList(params),
    queryFn: () => getAllCurrencies(params),
    placeholderData: keepPreviousData,
  });
};

const useCurrencyExchangeProvidersQuery = () => {
  return useQuery({
    queryKey: queryKeys.CurrencyExchangeProviders(),
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
      void queryClient.invalidateQueries({ queryKey: ['Currencies'] });
      void queryClient.invalidateQueries({ queryKey: ['CurrenciesList'] });
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
      void queryClient.invalidateQueries({ queryKey: ['Currencies'] });
      void queryClient.invalidateQueries({ queryKey: ['CurrenciesList'] });
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
      void queryClient.invalidateQueries({ queryKey: ['Currencies'] });
      void queryClient.invalidateQueries({ queryKey: ['CurrenciesList'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getAvailableCurrencies,
  getAllCurrencies,
  getCurrencyExchangeProviders,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  useAvailableCurrenciesQuery,
  useAllCurrenciesQuery,
  useCurrencyExchangeProvidersQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
};
