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
  Brand,
  BrandFormData,
  BulkActionParams,
  PaginatedData,
} from '@/types';
import { __ } from '@/wpi18n';

const getBrands = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.BRANDS, { params })
    .then((response) => unwrapData<PaginatedData<Brand>>(response));
};

const createBrand = (data: BrandFormData) => {
  return apiClient
    .post(endpoints.BRANDS, data)
    .then((response) => unwrapResponse<Brand>(response));
};

const updateBrand = ({ id, data }: { id: number; data: BrandFormData }) => {
  return apiClient
    .put(endpoints.BRAND(id), data)
    .then((response) => unwrapResponse<Brand>(response));
};

const deleteBrand = (id: number) => {
  return apiClient
    .delete(endpoints.BRAND(id))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteBrands = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.BRANDS_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};

const useBrandsQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Brands(params),
    queryFn: () => getBrands(params),
    placeholderData: keepPreviousData,
  });
};

const useCreateBrandMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBrand,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Brand created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Brands'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateBrandMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBrand,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Brand updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Brands'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteBrandMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBrand,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Brand deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Brands'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteBrandsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteBrands,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Brands deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Brands'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  bulkDeleteBrands,
  useBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useBulkDeleteBrandsMutation,
};
