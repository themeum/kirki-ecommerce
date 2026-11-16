import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { ReviewSchema, type ReviewStatusType } from '@/features/reviews/schemas/review';
import { reviewsKeys } from '@/features/reviews/services/query-keys';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseMessage,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getReviews = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.REVIEWS, { params })
    .then((response) => parseData(PaginatedDataSchema(ReviewSchema), response));
};

const updateReviewStatus = ({ id, status }: { id: number; status: ReviewStatusType }) => {
  return apiClient
    .put(endpoints.REVIEW_STATUS(id), { status })
    .then((response) => parseResponse(ReviewSchema, response));
};

const deleteReview = (id: number) => {
  return apiClient.delete(endpoints.REVIEW(id)).then((response) => parseMessage(response));
};

const bulkReviewAction = ({ action, ids = [] }: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.REVIEWS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

export const useReviewsQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: () => getReviews(params),
    placeholderData: keepPreviousData,
  });
};

export const useUpdateReviewStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReviewStatus,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Review updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReview,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Review deleted', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export const useBulkReviewActionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkReviewAction,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Reviews updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};
