import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { customerKeys } from '@/features/customers';
import { apiClient } from '@/libs/api';
import { CustomerListItemSchema, CustomerSchema } from '@/schemas/catalog/customer';
import type { CustomerFormPayload } from '@/schemas/forms/customer-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListQueryParams } from '@/types/list-state';
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
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

const useCustomerQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
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
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  bulkDeleteCustomers, createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer, useBulkDeleteCustomersMutation, useCreateCustomerMutation, useCustomerQuery, useCustomersQuery, useDeleteCustomerMutation, useUpdateCustomerMutation,
};

