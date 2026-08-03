import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { OrderFormPayload, OrderItem } from '@/types';
import { __ } from '@/wpi18n';

const createOrder = (data: OrderFormPayload) => {
  return apiClient
    .post(endpoints.ORDERS, data)
    .then((response) => unwrapResponse<OrderItem>(response));
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

export { createOrder, useCreateOrderMutation };
