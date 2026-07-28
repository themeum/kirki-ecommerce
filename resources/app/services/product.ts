import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { ProductListItemSchema, ProductSchema } from '@/schemas/catalog/product';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
  unwrapResponse,
} from '@/services/helpers';
import type { BulkActionParams, ListParams, ProductFormData } from '@/types';
import { ProductListFilter } from '@/types/filters/product';
import { __ } from '@/wpi18n';

const getProducts = (params: ListParams<ProductListFilter> = {}) => {
  return apiClient
    .get(endpoints.PRODUCTS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(ProductListItemSchema), response),
    );
};

const getProduct = (id: string | number) => {
  return apiClient
    .get(endpoints.PRODUCT(id))
    .then((response) => parseData(ProductSchema, response));
};

const createProduct = (data: ProductFormData) => {
  return apiClient
    .post(endpoints.PRODUCTS, data)
    .then((response) => parseResponse(ProductSchema, response));
};

const updateProduct = ({
  id,
  data,
}: {
  id: string | number;
  data: ProductFormData;
}) => {
  return apiClient
    .put(endpoints.PRODUCT(id), data)
    .then((response) => parseResponse(ProductSchema, response));
};

const deleteProduct = (id: number) => {
  return apiClient
    .delete(endpoints.PRODUCT(id))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteProducts = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.PRODUCTS_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};

const useProductsQuery = (params: ListParams<ProductListFilter> = {}) => {
  return useQuery({
    queryKey: queryKeys.Products(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });
};

const useProductQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Product(id),
    queryFn: () => getProduct(id),
    enabled: enabled && Boolean(id) && id !== 'create',
  });
};

const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Product created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Products'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
        __('Product updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Products'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Product(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: ['Inventory'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Product deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Products'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteProductsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteProducts,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Products deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Products'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  bulkDeleteProducts, createProduct, deleteProduct, getProduct, getProducts, updateProduct, useBulkDeleteProductsMutation, useCreateProductMutation, useDeleteProductMutation, useProductQuery, useProductsQuery, useUpdateProductMutation
};
