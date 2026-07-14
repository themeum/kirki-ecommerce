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
  Attribute,
  AttributeFormData,
  AttributeValue,
  AttributeValueFormData,
  BulkActionParams,
  PaginatedData,
} from '@/types';
import { __ } from '@/wpi18n';

const getAttributes = async (params: QueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.ATTRIBUTES, { params })
    .then((response) => unwrapData<PaginatedData<Attribute>>(response));
  return data.results;
};

const getAttribute = (id: number) => {
  return apiClient
    .get(endpoints.ATTRIBUTE(id))
    .then((response) => unwrapData<Attribute>(response));
};

const getAttributeValues = (id: number, params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.ATTRIBUTE_VALUES(id), { params })
    .then((response) => unwrapData<PaginatedData<AttributeValue>>(response));
};

const createAttribute = (data: AttributeFormData) => {
  return apiClient
    .post(endpoints.ATTRIBUTES, data)
    .then((response) => unwrapResponse<Attribute>(response));
};

const updateAttribute = ({
  id,
  data,
}: {
  id: number;
  data: AttributeFormData;
}) => {
  return apiClient
    .put(endpoints.ATTRIBUTE(id), data)
    .then((response) => unwrapResponse<Attribute>(response));
};

const deleteAttribute = (id: number) => {
  return apiClient
    .delete(endpoints.ATTRIBUTE(id))
    .then((response) => unwrapResponse(response));
};

const createAttributeValue = (data: AttributeValueFormData) => {
  return apiClient
    .post(endpoints.ATTRIBUTE_VALUES(data.attribute_id!), data)
    .then((response) => unwrapResponse<AttributeValue>(response));
};

const updateAttributeValue = (params: AttributeValueFormData) => {
  const { attribute_id, value_id, value, color } = params;
  const data = {
    value,
    ...(color !== undefined && { color }),
  };
  return apiClient
    .put(endpoints.ATTRIBUTE_VALUE(attribute_id!, value_id!), data)
    .then((response) => unwrapResponse<AttributeValue>(response));
};

const deleteAttributeValue = (params: AttributeValueFormData) => {
  return apiClient
    .delete(endpoints.ATTRIBUTE_VALUE(params.attribute_id!, params.value_id!))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteAttributeValues = ({
  action = 'delete',
  attribute_id,
  ids = [],
}: BulkActionParams & { attribute_id: number }) => {
  return apiClient
    .post(endpoints.ATTRIBUTE_VALUES_BULK(attribute_id), { action, ids })
    .then((response) => unwrapResponse(response));
};

const useAttributesQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Attributes(params),
    queryFn: () => getAttributes(params),
    placeholderData: keepPreviousData,
  });
};

const useAttributeQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Attribute(id),
    queryFn: () => getAttribute(id),
    enabled: enabled && Boolean(id),
  });
};

const useAttributeValuesQuery = (
  id: number,
  params: QueryParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.AttributeValues(id, params),
    queryFn: () => getAttributeValues(id, params),
    enabled: enabled && Boolean(id),
    placeholderData: keepPreviousData,
  });
};

const useCreateAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttribute,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAttribute,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteAttributeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttribute,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useCreateAttributeValueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAttributeValue,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute value created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
      void queryClient.invalidateQueries({ queryKey: ['AttributeValues'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateAttributeValueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAttributeValue,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute value updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
      void queryClient.invalidateQueries({ queryKey: ['AttributeValues'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteAttributeValueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAttributeValue,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute value deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
      void queryClient.invalidateQueries({ queryKey: ['AttributeValues'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteAttributeValuesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteAttributeValues,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Attribute values deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Attributes'] });
      void queryClient.invalidateQueries({ queryKey: ['AttributeValues'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getAttributes,
  getAttribute,
  getAttributeValues,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  bulkDeleteAttributeValues,
  useAttributesQuery,
  useAttributeQuery,
  useAttributeValuesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useBulkDeleteAttributeValuesMutation,
};
