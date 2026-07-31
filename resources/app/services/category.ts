import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { CategorySchema } from '@/schemas/catalog/category';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { ListQueryParams, BulkActionParams, CategoryFormData } from '@/types';
import { __ } from '@/wpi18n';

const getCategories = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.CATEGORIES, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(CategorySchema), response),
    );
};

const createCategory = (data: CategoryFormData) => {
  return apiClient
    .post(endpoints.CATEGORIES, data)
    .then((response) => parseResponse(CategorySchema, response));
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
    .then((response) => parseResponse(CategorySchema, response));
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

const useCategoriesQuery = (params: ListQueryParams = {}) => {
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
        response.message ||
          __('Category created successfully.', 'kirki-ecommerce'),
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
        response.message ||
          __('Category updated successfully.', 'kirki-ecommerce'),
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
        response.message ||
          __('Category deleted successfully.', 'kirki-ecommerce'),
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
        response.message ||
          __('Categories deleted successfully.', 'kirki-ecommerce'),
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
