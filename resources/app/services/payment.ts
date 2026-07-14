import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type { PaymentGateway, PaymentMethod } from '@/types';
import { __ } from '@/wpi18n';

const getInstallablePaymentGateways = () => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAYS_INSTALLABLE)
    .then((response) => unwrapData(response));
};

const getPaymentGateways = () => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAYS)
    .then((response) => unwrapData<PaymentGateway[]>(response));
};

const getPaymentGateway = (id: string | number) => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAY(id))
    .then((response) => unwrapData<PaymentGateway>(response));
};

const installPaymentGateway = (id: unknown) => {
  return apiClient
    .post(endpoints.PAYMENT_GATEWAYS_INSTALL, id)
    .then((response) => unwrapResponse(response));
};

const updatePaymentGateway = ({
  id,
  data,
}: {
  id: string | number;
  data: Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.PAYMENT_GATEWAY(id), data)
    .then((response) => unwrapResponse(response));
};

const setEnabledPaymentGateway = ({
  id,
  data,
}: {
  id: string | number;
  data: Record<string, unknown>;
}) => {
  return apiClient
    .patch(endpoints.PAYMENT_GATEWAY(id), data)
    .then((response) => unwrapResponse(response));
};

const getPaymentMethods = () => {
  return apiClient
    .get(endpoints.PAYMENT_METHODS)
    .then((response) => unwrapData<PaymentMethod[]>(response));
};

const createPaymentMethod = (data: Record<string, unknown>) => {
  return apiClient
    .post(endpoints.PAYMENT_METHODS, data)
    .then((response) => unwrapResponse<PaymentMethod>(response));
};

const updatePaymentMethod = ({
  id,
  data,
}: {
  id: string | number;
  data: Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.PAYMENT_METHOD(id), data)
    .then((response) => unwrapResponse(response));
};

const deletePaymentMethod = (id: string | number) => {
  return apiClient
    .delete(endpoints.PAYMENT_METHOD(id))
    .then((response) => unwrapResponse(response));
};

const useInstallablePaymentGatewaysQuery = () => {
  return useQuery({
    queryKey: queryKeys.InstallablePaymentGateways(),
    queryFn: getInstallablePaymentGateways,
  });
};

const usePaymentGatewaysQuery = () => {
  return useQuery({
    queryKey: queryKeys.PaymentGateways(),
    queryFn: getPaymentGateways,
  });
};

const usePaymentGatewayQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.PaymentGateway(id),
    queryFn: () => getPaymentGateway(id),
    enabled: enabled && Boolean(id),
  });
};

const usePaymentMethodsQuery = () => {
  return useQuery({
    queryKey: queryKeys.PaymentMethods(),
    queryFn: getPaymentMethods,
  });
};

const useInstallPaymentGatewayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installPaymentGateway,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Payment gateway installed successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentGateways'] });
      void queryClient.invalidateQueries({
        queryKey: ['InstallablePaymentGateways'],
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdatePaymentGatewayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentGateway,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
          __('Payment gateway updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentGateways'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.PaymentGateway(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useSetEnabledPaymentGatewayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setEnabledPaymentGateway,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Payment gateway updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentGateways'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useCreatePaymentMethodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPaymentMethod,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Payment method created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentMethods'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdatePaymentMethodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentMethod,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Payment method updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentMethods'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeletePaymentMethodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Payment method deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['PaymentMethods'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getInstallablePaymentGateways,
  getPaymentGateways,
  getPaymentGateway,
  installPaymentGateway,
  updatePaymentGateway,
  setEnabledPaymentGateway,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  useInstallablePaymentGatewaysQuery,
  usePaymentGatewaysQuery,
  usePaymentGatewayQuery,
  usePaymentMethodsQuery,
  useInstallPaymentGatewayMutation,
  useUpdatePaymentGatewayMutation,
  useSetEnabledPaymentGatewayMutation,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
};
