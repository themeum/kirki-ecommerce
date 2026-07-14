import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type {
  BulkActionParams,
  Category,
  CategoryFormData,
  PaginatedData,
} from '@/types';
import { __ } from '@/wpi18n';

const getCategories = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.CATEGORIES, { params })
    .then((response) => unwrapData<PaginatedData<Category>>(response));
};

const createCategory = (data: CategoryFormData) => {
  return apiClient
    .post(endpoints.CATEGORIES, data)
    .then((response) => unwrapResponse<Category>(response));
};

const updateCategory = ({
  id,
  data,
}: {
  id: number;
  data: CategoryFormData;
}) => {
  return apiClient
    .put(endpoints.CATEGORY(id), data)
    .then((response) => unwrapResponse<Category>(response));
};

const deleteCategory = (id: number) => {
  return apiClient
    .delete(endpoints.CATEGORY(id))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteCategories = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.CATEGORIES_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};

const useCategoriesQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Categories(params),
    queryFn: () => getCategories(params),
    placeholderData: keepPreviousData,
  });
};

const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Category created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Categories'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Category updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Categories'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Category deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Categories'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteCategoriesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteCategories,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Categories deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Categories'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useBulkDeleteCategoriesMutation,
};
