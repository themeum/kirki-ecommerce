import { endpoints } from '@/config/endpoints';
import { Activity, ActivitySchema } from '@/features/orders/schemas/catalog/activity';
import { ActivityFormPayload } from '@/features/orders/schemas/forms/activity-form';
import { orderKeys } from '@/features/orders/services/query-keys';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseMessage,
  toastMutationError,
  toastMutationSuccess,
  unwrapResponse,
} from '@/services/helpers';
import { ListParams } from '@/types/list-state';
import { __ } from '@/wpi18n';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ACTIVITIES_PAGE_SIZE = 10;

const createOrderActivity = ({ orderId, data }: { orderId: number; data: ActivityFormPayload }) => {
  return apiClient
    .post(endpoints.ORDER_ACTIVITIES(orderId), data)
    .then((response) => unwrapResponse<Activity>(response));
};

const getOrderActivities = (orderId: number, params: ListParams = {}) => {
  return apiClient
    .get(endpoints.ORDER_ACTIVITIES(orderId), { params })
    .then((response) => parseData(PaginatedDataSchema(ActivitySchema), response));
};

const deleteOrderActivity = ({ orderId, activityId }: { orderId: number; activityId: number }) => {
  return apiClient
    .delete(endpoints.ORDER_ACTIVITY(orderId, activityId))
    .then((response) => parseMessage(response));
};

const useCreateOrderActivityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrderActivity,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message || __('Comment added successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: orderKeys.activities(variables.orderId) });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useOrderActivitiesInfiniteQuery = (orderId: number) => {
  return useInfiniteQuery({
    queryKey: orderKeys.activities(orderId),
    queryFn: ({ pageParam }) =>
      getOrderActivities(orderId, { limit: ACTIVITIES_PAGE_SIZE, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.has_more_pages ? lastPageParam + 1 : undefined,
    enabled: Boolean(orderId),
  });
};

const useDeleteOrderActivityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrderActivity,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message || __('Comment deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: orderKeys.activities(variables.orderId) });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  useCreateOrderActivityMutation,
  useDeleteOrderActivityMutation,
  useOrderActivitiesInfiniteQuery,
};
