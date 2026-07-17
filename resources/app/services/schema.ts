import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { SchemaProfileSchema } from '@/schemas/catalog/schema-profile';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
  unwrapResponse,
} from '@/services/helpers';
import type { SchemaFormData } from '@/types';
import { __ } from '@/wpi18n';

const getSchemas = async (params: QueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.PRODUCT_SCHEMAS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(SchemaProfileSchema), response),
    );
  return data.results;
};

const createSchema = (data: SchemaFormData) => {
  return apiClient
    .post(endpoints.PRODUCT_SCHEMAS, data)
    .then((response) => parseResponse(SchemaProfileSchema, response));
};

const updateSchema = ({
  id,
  data,
}: {
  id: number;
  data: SchemaFormData;
}) => {
  return apiClient
    .put(endpoints.PRODUCT_SCHEMA(id), data)
    .then((response) => parseResponse(SchemaProfileSchema, response));
};

const deleteSchema = (id: number) => {
  return apiClient
    .delete(endpoints.PRODUCT_SCHEMA(id))
    .then((response) => unwrapResponse(response));
};

const useSchemasQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Schemas(params),
    queryFn: () => getSchemas(params),
    placeholderData: keepPreviousData,
  });
};

const useCreateSchemaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchema,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Schema created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Schemas'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateSchemaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSchema,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Schema updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Schemas'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteSchemaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSchema,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Schema deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Schemas'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getSchemas,
  createSchema,
  updateSchema,
  deleteSchema,
  useSchemasQuery,
  useCreateSchemaMutation,
  useUpdateSchemaMutation,
  useDeleteSchemaMutation,
};
