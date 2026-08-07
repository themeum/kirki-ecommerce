import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { PaymentGatewayListSchema, PaymentGatewaySchema, PaymentMethodSchema } from '@/schemas/catalog/payment';
import type { ManualPaymentFormPayload } from '@/schemas/forms/manual-payment-form';
import type { PaymentGatewayEditFormPayload } from '@/schemas/forms/payment-gateway-form';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import { __ } from '@/wpi18n';

const getInstallablePaymentGateways = () => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAYS_INSTALLABLE)
    .then((response) => parseData(ResourceCollectionSchema(PaymentGatewaySchema), response));
};

const getPaymentGateways = () => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAYS)
    .then((response) => parseData(PaymentGatewayListSchema, response));
};

const getPaymentGateway = (id: string | number) => {
  return apiClient
    .get(endpoints.PAYMENT_GATEWAY(id))
    .then((response) => parseData(PaymentGatewaySchema, response));
};

const installPaymentGateway = (data: { id: string | number }) => {
  return apiClient
    .post(endpoints.PAYMENT_GATEWAYS_INSTALL, data)
    .then((response) => parseResponse(PaymentGatewaySchema, response));
};

const updatePaymentGateway = ({
  id,
  data,
}: {
  id: string | number;
  data: PaymentGatewayEditFormPayload;
}) => {
  return apiClient
    .put(endpoints.PAYMENT_GATEWAY(id), data)
    .then((response) => parseResponse(PaymentGatewaySchema, response));
};

const setEnabledPaymentGateway = ({
  id,
  data,
}: {
  id: string | number;
  data: { is_enabled: boolean };
}) => {
  return apiClient
    .patch(endpoints.PAYMENT_GATEWAY(id), data)
    .then((response) => parseResponse(z.boolean(), response));
};

const getPaymentMethods = () => {
  return apiClient
    .get(endpoints.PAYMENT_METHODS)
    .then((response) => parseData(ResourceCollectionSchema(PaymentMethodSchema), response));
};

const createPaymentMethod = (data: ManualPaymentFormPayload) => {
  return apiClient
    .post(endpoints.PAYMENT_METHODS, data)
    .then((response) => parseResponse(PaymentMethodSchema, response));
};

const updatePaymentMethod = ({
  id,
  data,
}: {
  id: string | number;
  data: ManualPaymentFormPayload | Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.PAYMENT_METHOD(id), data)
    .then((response) => parseResponse(PaymentMethodSchema, response));
};

const deletePaymentMethod = (id: string | number) => {
  return apiClient
    .delete(endpoints.PAYMENT_METHOD(id))
    .then((response) => parseMessage(response));
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
  createPaymentMethod, deletePaymentMethod, getInstallablePaymentGateways, getPaymentGateway, getPaymentGateways, getPaymentMethods, installPaymentGateway, setEnabledPaymentGateway, updatePaymentGateway, updatePaymentMethod, useCreatePaymentMethodMutation, useDeletePaymentMethodMutation, useInstallablePaymentGatewaysQuery, useInstallPaymentGatewayMutation, usePaymentGatewayQuery, usePaymentGatewaysQuery, usePaymentMethodsQuery, useSetEnabledPaymentGatewayMutation, useUpdatePaymentGatewayMutation, useUpdatePaymentMethodMutation
};

