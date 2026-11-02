import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import { paymentKeys } from '@/features/settings';
import {
  OfflinePaymentSchema,
  OnlinePaymentListSchema,
  OnlinePaymentSchema,
  type PaymentMethod,
  PaymentMethodSchema,
} from '@/features/settings/payment/schemas/catalog/payment';
import type { OfflinePaymentFormPayload } from '@/features/settings/payment/schemas/forms/offline-payment-form';
import type { OnlinePaymentEditFormPayload } from '@/features/settings/payment/schemas/forms/online-payment-form';
import { apiClient } from '@/libs/api';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseMessage,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';
import { __ } from '@/wpi18n';

const getPaymentMethods = () => {
  return apiClient
    .get(endpoints.PAYMENT_METHODS)
    .then((response) => parseData(ResourceCollectionSchema(PaymentMethodSchema), response));
};

const reorderPaymentMethods = (ids: PaymentMethod['id'][]) => {
  return apiClient
    .put(endpoints.PAYMENT_METHODS_ORDER, { ids })
    .then((response) => parseResponse(ResourceCollectionSchema(PaymentMethodSchema), response));
};

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

const setEnabledOfflinePayment = ({
  id,
  data,
}: {
  id: string | number;
  data: { is_enabled: boolean };
}) => {
  return apiClient
    .patch(endpoints.OFFLINE_PAYMENT(id), data)
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
  return apiClient.delete(endpoints.OFFLINE_PAYMENT(id)).then((response) => parseMessage(response));
};

const updatePaymentMethodsCache = async (
  queryClient: QueryClient,
  updater: (methods: PaymentMethod[]) => PaymentMethod[],
) => {
  await queryClient.cancelQueries({ queryKey: paymentKeys.methods.all });
  const previous = queryClient.getQueryData<PaymentMethod[]>(paymentKeys.methods.all);
  queryClient.setQueryData<PaymentMethod[]>(
    paymentKeys.methods.all,
    (methods) => methods && updater(methods),
  );
  return { previous };
};

const restorePaymentMethodsCache = (
  queryClient: QueryClient,
  previous: PaymentMethod[] | undefined,
) => {
  if (previous) {
    queryClient.setQueryData<PaymentMethod[]>(paymentKeys.methods.all, previous);
  }
};

const setMethodEnabled = (id: string | number, isEnabled: boolean) => {
  return (methods: PaymentMethod[]) =>
    methods.map((method) => (method.id === id ? { ...method, is_enabled: isEnabled } : method));
};

const sortMethodsByIds = (ids: PaymentMethod['id'][]) => {
  return (methods: PaymentMethod[]) =>
    [...methods].sort((first, second) => ids.indexOf(first.id) - ids.indexOf(second.id));
};

const usePaymentMethodsQuery = () => {
  return useQuery({
    queryKey: paymentKeys.methods.all,
    queryFn: getPaymentMethods,
  });
};

const useInstallableOnlinePaymentsQuery = () => {
  return useQuery({
    queryKey: paymentKeys.installableOnline(),
    queryFn: getInstallableOnlinePayments,
  });
};

const useOnlinePaymentsQuery = () => {
  return useQuery({
    queryKey: paymentKeys.online.all,
    queryFn: getOnlinePayments,
  });
};

const useOnlinePaymentQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.onlineDetail(id),
    queryFn: () => getOnlinePayment(id),
    enabled: enabled && Boolean(id),
  });
};

const useOfflinePaymentsQuery = () => {
  return useQuery({
    queryKey: paymentKeys.offline.all,
    queryFn: getOfflinePayments,
  });
};

const useInstallOnlinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installOnlinePayment,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Payment gateway installed', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.online.all });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.methods.all });
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.installableOnline(),
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
      toastMutationSuccess(response.message || __('Payment gateway updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.online.all });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.methods.all });
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.onlineDetail(variables.id),
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
    onMutate({ id, data }) {
      return updatePaymentMethodsCache(queryClient, setMethodEnabled(id, data.is_enabled));
    },
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Payment gateway updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.online.all });
    },
    onError(error, _variables, context) {
      restorePaymentMethodsCache(queryClient, context?.previous);
      toastMutationError(error);
    },
  });
};

const useReorderPaymentMethodsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderPaymentMethods,
    onMutate(ids) {
      return updatePaymentMethodsCache(queryClient, sortMethodsByIds(ids));
    },
    onSuccess(response) {
      queryClient.setQueryData<PaymentMethod[]>(paymentKeys.methods.all, response.data);
      void queryClient.invalidateQueries({ queryKey: paymentKeys.online.all });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.offline.all });
    },
    onError(error, _variables, context) {
      restorePaymentMethodsCache(queryClient, context?.previous);
      toastMutationError(error);
    },
  });
};

const useCreateOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOfflinePayment,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Payment method created', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.offline.all });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.methods.all });
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
      toastMutationSuccess(response.message || __('Payment method updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.offline.all });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.methods.all });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useSetEnabledOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setEnabledOfflinePayment,
    onMutate({ id, data }) {
      return updatePaymentMethodsCache(queryClient, setMethodEnabled(id, data.is_enabled));
    },
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Payment method updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.offline.all });
    },
    onError(error, _variables, context) {
      restorePaymentMethodsCache(queryClient, context?.previous);
      toastMutationError(error);
    },
  });
};

const useDeleteOfflinePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOfflinePayment,
    onMutate(id) {
      return updatePaymentMethodsCache(queryClient, (methods) =>
        methods.filter((method) => method.id !== id),
      );
    },
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Payment method deleted', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: paymentKeys.offline.all });
    },
    onError(error, _variables, context) {
      restorePaymentMethodsCache(queryClient, context?.previous);
      toastMutationError(error);
    },
  });
};

export {
  createOfflinePayment,
  deleteOfflinePayment,
  getInstallableOnlinePayments,
  getOfflinePayments,
  getOnlinePayment,
  getOnlinePayments,
  getPaymentMethods,
  installOnlinePayment,
  reorderPaymentMethods,
  setEnabledOfflinePayment,
  setEnabledOnlinePayment,
  updateOfflinePayment,
  updateOnlinePayment,
  useCreateOfflinePaymentMutation,
  useDeleteOfflinePaymentMutation,
  useInstallableOnlinePaymentsQuery,
  useInstallOnlinePaymentMutation,
  useOfflinePaymentsQuery,
  useOnlinePaymentQuery,
  useOnlinePaymentsQuery,
  usePaymentMethodsQuery,
  useReorderPaymentMethodsMutation,
  useSetEnabledOfflinePaymentMutation,
  useSetEnabledOnlinePaymentMutation,
  useUpdateOfflinePaymentMutation,
  useUpdateOnlinePaymentMutation,
};
