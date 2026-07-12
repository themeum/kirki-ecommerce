import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type {
  BulkActionParams,
  Customer,
  CustomerFormData,
  PaginatedData,
} from '@/types';
import { __ } from '@/wpi18n';

const getCustomers = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.CUSTOMERS, { params })
    .then((response) => unwrapData<PaginatedData<Customer>>(response));
};

const getCustomer = (id: number) => {
  return apiClient
    .get(endpoints.CUSTOMER(id))
    .then((response) => unwrapData<Customer>(response));
};

const createCustomer = (data: CustomerFormData) => {
  return apiClient
    .post(endpoints.CUSTOMERS, data)
    .then((response) => unwrapResponse<Customer>(response));
};

const updateCustomer = ({
  id,
  data,
}: {
  id: number;
  data: CustomerFormData;
}) => {
  return apiClient
    .put(endpoints.CUSTOMER(id), data)
    .then((response) => unwrapResponse<Customer>(response));
};

const deleteCustomer = (id: number) => {
  return apiClient
    .delete(endpoints.CUSTOMER(id))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteCustomers = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.CUSTOMERS_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};

const useCustomersQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Customers(params),
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
  });
};

const useCustomerQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Customer(id),
    queryFn: () => getCustomer(id),
    enabled: enabled && Boolean(id),
  });
};

const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Customer created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Customers'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
          __('Customer updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Customers'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Customer(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Customer deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Customers'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteCustomersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteCustomers,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Customers deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Customers'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  useCustomersQuery,
  useCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useBulkDeleteCustomersMutation,
};
