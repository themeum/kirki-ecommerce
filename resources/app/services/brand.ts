import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { BrandSchema } from '@/schemas/catalog/brand';
import type { BrandFormPayload } from '@/schemas/forms/brand-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams, ListQueryParams } from '@/types';
import { __ } from '@/wpi18n';

const getBrands = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.BRANDS, { params })
    .then((response) => parseData(PaginatedDataSchema(BrandSchema), response));
};

const createBrand = (data: BrandFormPayload) => {
  return apiClient
    .post(endpoints.BRANDS, data)
    .then((response) => parseResponse(BrandSchema, response));
};

const updateBrand = ({ id, data }: { id: number; data: BrandFormPayload }) => {
  return apiClient
    .put(endpoints.BRAND(id), data)
    .then((response) => parseResponse(BrandSchema, response));
};

const deleteBrand = (id: number) => {
  return apiClient
    .delete(endpoints.BRAND(id))
    .then((response) => parseMessage(response));
};

const bulkDeleteBrands = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.BRANDS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

const useBrandsQuery = (params: ListQueryParams = {}) => {
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
  bulkDeleteBrands, createBrand, deleteBrand, getBrands, updateBrand, useBrandsQuery, useBulkDeleteBrandsMutation, useCreateBrandMutation, useDeleteBrandMutation, useUpdateBrandMutation,
};

