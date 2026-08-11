import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { OfflinePaymentSchema, OnlinePaymentListSchema, OnlinePaymentSchema } from '@/schemas/catalog/payment';
import type { OfflinePaymentFormPayload } from '@/schemas/forms/offline-payment-form';
import type { OnlinePaymentEditFormPayload } from '@/schemas/forms/online-payment-form';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import { __ } from '@/wpi18n';

const getInstallableOnlinePayments = () => {
  return apiClient
    .get(endpoints.ONLINE_PAYMENTS_INSTALLABLE)
    .then((response) => parseData(ResourceCollectionSchema(OnlinePaymentSchema), response));
};

const getOnlinePayments = () => {
  return apiClient
    .get(endpoints.ONLINE_PAYMENTS)
    .then((response) => parseData(OnlinePaymentListSchema, response));
};

const getOnlinePayment = (id: string | number) => {
  return apiClient
    .get(endpoints.ONLINE_PAYMENT(id))
    .then((response) => parseData(OnlinePaymentSchema, response));
};

const installOnlinePayment = (data: { id: string | number }) => {
  return apiClient
    .post(endpoints.ONLINE_PAYMENTS_INSTALL, data)
    .then((response) => parseResponse(OnlinePaymentSchema, response));
};

const updateOnlinePayment = ({
  id,
  data,
}: {
  id: string | number;
  data: OnlinePaymentEditFormPayload;
}) => {
  return apiClient
    .put(endpoints.ONLINE_PAYMENT(id), data)
    .then((response) => parseResponse(OnlinePaymentSchema, response));
};

const setEnabledOnlinePayment = ({
  id,
  data,
}: {
  id: string | number;
  data: { is_enabled: boolean };
}) => {
  return apiClient
    .patch(endpoints.ONLINE_PAYMENT(id), data)
    .then((response) => parseResponse(z.boolean(), response));
};

const getOfflinePayments = () => {
  return apiClient
    .get(endpoints.OFFLINE_PAYMENTS)
    .then((response) => parseData(ResourceCollectionSchema(OfflinePaymentSchema), response));
};

const createOfflinePayment = (data: OfflinePaymentFormPayload) => {
  return apiClient
    .post(endpoints.OFFLINE_PAYMENTS, data)
    .then((response) => parseResponse(OfflinePaymentSchema, response));
};

const updateOfflinePayment = ({
  id,
  data,
}: {
  id: string | number;
  data: OfflinePaymentFormPayload | Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.OFFLINE_PAYMENT(id), data)
    .then((response) => parseResponse(OfflinePaymentSchema, response));
};

const deleteOfflinePayment = (id: string | number) => {
  return apiClient
    .delete(endpoints.OFFLINE_PAYMENT(id))
    .then((response) => parseMessage(response));
};

const useInstallableOnlinePaymentsQuery = () => {
  return useQuery({
    queryKey: queryKeys.InstallableOnlinePayments(),
    queryFn: getInstallableOnlinePayments,
  });
};

const useOnlinePaymentsQuery = () => {
  return useQuery({
    queryKey: queryKeys.OnlinePayments(),
    queryFn: getOnlinePayments,
  });
};

const useOnlinePaymentQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.OnlinePayment(id),
    queryFn: () => getOnlinePayment(id),
    enabled: enabled && Boolean(id),
  });
};

const useOfflinePaymentsQuery = () => {
  return useQuery({
    queryKey: queryKeys.OfflinePayments(),
    queryFn: getOfflinePayments,
  });
};

const useInstallOnlinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installOnlinePayment,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Payment gateway installed successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OnlinePayments'] });
      void queryClient.invalidateQueries({
        queryKey: ['InstallableOnlinePayments'],
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateOnlinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOnlinePayment,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Payment gateway updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OnlinePayments'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.OnlinePayment(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useSetEnabledOnlinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setEnabledOnlinePayment,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Payment gateway updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OnlinePayments'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useCreateOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOfflinePayment,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Payment method created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OfflinePayments'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOfflinePayment,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Payment method updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OfflinePayments'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOfflinePayment,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Payment method deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['OfflinePayments'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  createOfflinePayment, deleteOfflinePayment, getInstallableOnlinePayments, getOfflinePayments, getOnlinePayment, getOnlinePayments, installOnlinePayment, setEnabledOnlinePayment, updateOfflinePayment, updateOnlinePayment, useCreateOfflinePaymentMutation, useDeleteOfflinePaymentMutation, useInstallableOnlinePaymentsQuery, useInstallOnlinePaymentMutation, useOfflinePaymentsQuery, useOnlinePaymentQuery, useOnlinePaymentsQuery, useSetEnabledOnlinePaymentMutation, useUpdateOfflinePaymentMutation, useUpdateOnlinePaymentMutation,
};

