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
  PaginatedData,
  Product,
  ProductFormData,
  ProductListItem,
} from '@/types';
import { __ } from '@/wpi18n';

const getProducts = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.PRODUCTS, { params })
    .then((response) => unwrapData<PaginatedData<ProductListItem>>(response));
};

const getProduct = (id: string | number) => {
  return apiClient
    .get(endpoints.PRODUCT(id))
    .then((response) => unwrapData<Product>(response));
};

const createProduct = (data: ProductFormData) => {
  return apiClient
    .post(endpoints.PRODUCTS, data)
    .then((response) => unwrapResponse<Product>(response));
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
    .then((response) => unwrapResponse<Product>(response));
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

const useProductsQuery = (params: QueryParams = {}) => {
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
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  useProductsQuery,
  useProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkDeleteProductsMutation,
};
