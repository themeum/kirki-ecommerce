import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { NEW_ITEM_ID } from '@/conf';
import { endpoints } from '@/config/endpoints';
import type { OrderListFilter } from '@/features/orders';
import { orderKeys } from '@/features/orders';
import type { OrderActionPayload } from '@/features/orders/lib/order-actions';
import type { OrderItem } from '@/features/orders/schemas/catalog/order';
import { OrderCalculationSchema, OrderItemSchema, OrderListItemSchema } from '@/features/orders/schemas/catalog/order';
import type { OrderCalculationRequestPayload, OrderFormPayload } from '@/features/orders/schemas/forms/order-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { ListParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const createOrder = (data: OrderFormPayload) => {
  return apiClient
    .post(endpoints.ORDERS, data)
    .then((response) => unwrapResponse<OrderItem>(response));
};

const getOrders = (params: ListParams<OrderListFilter> = {}) => {
  return apiClient
    .get(endpoints.ORDERS, { params })
    .then((response) => parseData(PaginatedDataSchema(OrderListItemSchema), response));
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
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useOrdersQuery = (params: ListParams<OrderListFilter> = {}) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });
};

const useOrderQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.id),
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
      void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.id),
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
    queryKey: orderKeys.calculation(payload),
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
  useOrdersQuery,
  useUpdateOrderMutation,
};

