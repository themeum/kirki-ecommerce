import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { inventoryKeys } from '@/features/inventory';
import type { ProductListFilter } from '@/features/products';
import { productKeys } from '@/features/products';
import { ProductListItemSchema, ProductListItemWithVariantsSchema, ProductSchema } from '@/features/products/schemas/catalog/product';
import type { ProductFormPayload } from '@/features/products/schemas/forms/product-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getProducts = (params: ListParams<ProductListFilter> = {}) => {
  return apiClient
    .get(endpoints.PRODUCTS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(ProductListItemSchema), response),
    );
};

const getProductsWithVariants = (params: ListParams<ProductListFilter> = {}) => {
  return apiClient
    .get(endpoints.PRODUCT_VARIANTS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(ProductListItemWithVariantsSchema), response),
    );
};

const getProduct = (id: string | number) => {
  return apiClient
    .get(endpoints.PRODUCT(id))
    .then((response) => parseData(ProductSchema, response));
};

const createProduct = (data: ProductFormPayload) => {
  return apiClient
    .post(endpoints.PRODUCTS, data)
    .then((response) => parseResponse(ProductSchema, response));
};

const updateProduct = ({
  id,
  data,
}: {
  id: string | number;
  data: ProductFormPayload;
}) => {
  return apiClient
    .put(endpoints.PRODUCT(id), data)
    .then((response) => parseResponse(ProductSchema, response));
};

const bulkDeleteProducts = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.PRODUCTS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

const useProductsQuery = (params: ListParams<ProductListFilter> = {}, enabled = true) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

const useProductsWithVariantsQuery = (params: ListParams<ProductListFilter> = {}, enabled = true) => {
  return useQuery({
    queryKey: productKeys.withVariantsList(params),
    queryFn: () => getProductsWithVariants(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

const useProductQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: productKeys.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.withVariantsLists() });
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
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.withVariantsLists() });
      void queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
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
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productKeys.withVariantsLists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  bulkDeleteProducts, createProduct, getProduct, getProducts, updateProduct, useBulkDeleteProductsMutation, useCreateProductMutation, useProductQuery, useProductsQuery, useProductsWithVariantsQuery, useUpdateProductMutation,
};

