import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { OrderCalculationSchema } from '@/schemas/catalog/order';
import { parseData, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { OrderCalculationRequestPayload, OrderFormPayload, OrderItem } from '@/types';
import { __ } from '@/wpi18n';

const createOrder = (data: OrderFormPayload) => {
  return apiClient
    .post(endpoints.ORDERS, data)
    .then((response) => unwrapResponse<OrderItem>(response));
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

export { useCreateOrderMutation, useOrderCalculationQuery };
