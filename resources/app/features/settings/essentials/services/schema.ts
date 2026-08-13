import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { schemaProfileKeys } from '@/features/settings';
import { SchemaProfileSchema } from '@/features/settings/essentials/schemas/catalog/schema-profile';
import type { SchemaProfileFormPayload } from '@/features/settings/essentials/schemas/forms/schema-profile-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getSchemas = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.PRODUCT_SCHEMAS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(SchemaProfileSchema), response),
    );
  return data.results;
};

const createSchema = (data: SchemaProfileFormPayload) => {
  return apiClient
    .post(endpoints.PRODUCT_SCHEMAS, data)
    .then((response) => parseResponse(SchemaProfileSchema, response));
};

const updateSchema = ({
  id,
  data,
}: {
  id: number;
  data: SchemaProfileFormPayload;
}) => {
  return apiClient
    .put(endpoints.PRODUCT_SCHEMA(id), data)
    .then((response) => parseResponse(SchemaProfileSchema, response));
};

const deleteSchema = (id: number) => {
  return apiClient
    .delete(endpoints.PRODUCT_SCHEMA(id))
    .then((response) => parseMessage(response));
};

const useSchemasQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: schemaProfileKeys.list(params),
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
      void queryClient.invalidateQueries({ queryKey: schemaProfileKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: schemaProfileKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: schemaProfileKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  createSchema, deleteSchema, getSchemas, updateSchema, useCreateSchemaMutation, useDeleteSchemaMutation, useSchemasQuery, useUpdateSchemaMutation,
};

