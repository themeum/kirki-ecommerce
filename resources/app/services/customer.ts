import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { CustomerListItemSchema, CustomerSchema } from '@/schemas/catalog/customer';
import type { CustomerFormPayload } from '@/schemas/forms/customer-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams, BulkActionParams } from '@/types';
import { __ } from '@/wpi18n';

const getCustomers = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.CUSTOMERS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(CustomerListItemSchema), response),
    );
};

const getCustomer = (id: number) => {
  return apiClient
    .get(endpoints.CUSTOMER(id))
    .then((response) => parseData(CustomerSchema, response));
};

const createCustomer = (data: CustomerFormPayload) => {
  return apiClient
    .post(endpoints.CUSTOMERS, data)
    .then((response) => parseResponse(CustomerSchema, response));
};

const updateCustomer = ({
  id,
  data,
}: {
  id: number;
  data: CustomerFormPayload;
}) => {
  return apiClient
    .put(endpoints.CUSTOMER(id), data)
    .then((response) => parseResponse(CustomerSchema, response));
};

const deleteCustomer = (id: number) => {
  return apiClient
    .delete(endpoints.CUSTOMER(id))
    .then((response) => parseMessage(response));
};

const bulkDeleteCustomers = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.CUSTOMERS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

const useCustomersQuery = (params: ListQueryParams = {}, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Customers(params),
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
    enabled,
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
