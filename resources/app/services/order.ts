import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { NEW_ITEM_ID } from '@/conf';
import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { OrderCalculationSchema, OrderItemSchema } from '@/schemas/catalog/order';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { OrderActionPayload } from '@/pages/orders/order-details/config/order-actions';
import type { OrderCalculationRequestPayload, OrderFormPayload, OrderItem } from '@/types';
import { __ } from '@/wpi18n';

const createOrder = (data: OrderFormPayload) => {
  return apiClient
    .post(endpoints.ORDERS, data)
    .then((response) => unwrapResponse<OrderItem>(response));
};

const getOrder = (id: string | number) => {
  return apiClient
    .get(endpoints.ORDER(id))
    .then((response) => parseData(OrderItemSchema, response));
};

const updateOrder = ({ id, data }: { id: number; data: OrderFormPayload }) => {
  return apiClient
    .put(endpoints.ORDER(id), data)
    .then((response) => parseResponse(OrderItemSchema, response));
};

const performOrderAction = ({ id, ...payload }: OrderActionPayload & { id: number }) => {
  return apiClient
    .patch(endpoints.ORDER_ACTION(id), payload)
    .then((response) => parseResponse(OrderItemSchema, response));
};

const calculateOrder = (data: OrderCalculationRequestPayload) => {
  return apiClient
    .post(endpoints.CALCULATE_ORDER, data)
    .then((response) => parseData(OrderCalculationSchema, response));
};

const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Order created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.Orders() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useOrderQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Order(id),
    queryFn: () => getOrder(id),
    enabled: enabled && Boolean(id) && id !== NEW_ITEM_ID,
  });
};

const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrder,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Order updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.Orders() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Order(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useOrderActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performOrderAction,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Action performed successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.Orders() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Order(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useOrderCalculationQuery = (
  payload: OrderCalculationRequestPayload,
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.OrderCalculation(payload),
    queryFn: () => calculateOrder(payload),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export {
  useCreateOrderMutation,
  useOrderActionMutation,
  useOrderCalculationQuery,
  useOrderQuery,
  useUpdateOrderMutation,
};
