import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { CategorySchema } from '@/schemas/catalog/category';
import type { CategoryFormPayload } from '@/schemas/forms/category-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams, ListQueryParams } from '@/types';
import { __ } from '@/wpi18n';

const getCategories = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.CATEGORIES, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(CategorySchema), response),
    );
};

/**
 * The full add/edit dialog sends a complete `CategoryFormPayload`, but the
 * inline "create category" affordance inside the product form only ever
 * sends `name` and `parent_id` — the backend derives the rest server-side.
 */
const createCategory = (
  data: CategoryFormPayload | Pick<CategoryFormPayload, 'name' | 'parent_id'>,
) => {
  return apiClient
    .post(endpoints.CATEGORIES, data)
    .then((response) => parseResponse(CategorySchema, response));
};

const updateCategory = ({
  id,
  data,
}: {
  id: number;
  data: CategoryFormPayload;
}) => {
  return apiClient
    .put(endpoints.CATEGORY(id), data)
    .then((response) => parseResponse(CategorySchema, response));
};

const deleteCategory = (id: number) => {
  return apiClient
    .delete(endpoints.CATEGORY(id))
    .then((response) => parseMessage(response));
};

const bulkDeleteCategories = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.CATEGORIES_BULK, { action, ids })
    .then((response) => parseMessage(response));
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
  bulkDeleteCategories, createCategory, deleteCategory, getCategories, updateCategory, useBulkDeleteCategoriesMutation, useCategoriesQuery,
  useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation
};

