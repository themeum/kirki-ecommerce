import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { attributeKeys } from '@/features/products';
import { AttributeSchema, AttributeValueSchema } from '@/features/products/schemas/catalog/attribute';
import type { AddVariationFormPayload } from '@/features/products/schemas/forms/add-variation-form';
import type { VariationValueFormPayload } from '@/features/products/schemas/forms/variation-value-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema, ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getAttributes = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.ATTRIBUTES, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(AttributeSchema), response),
    );
  return data.results;
};

const getAttribute = (id: number) => {
  return apiClient
    .get(endpoints.ATTRIBUTE(id))
    .then((response) => parseData(AttributeSchema, response));
};

const getAttributeValues = (id: number, params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.ATTRIBUTE_VALUES(id), { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(AttributeValueSchema), response),
    );
};

const createAttribute = (data: AddVariationFormPayload) => {
  return apiClient
    .post(endpoints.ATTRIBUTES, data)
    .then((response) => parseResponse(AttributeSchema, response));
};

const updateAttribute = ({
  id,
  data,
}: {
  id: number;
  data: AddVariationFormPayload;
}) => {
  return apiClient
    .put(endpoints.ATTRIBUTE(id), data)
    .then((response) => parseResponse(AttributeSchema, response));
};

const deleteAttribute = (id: number) => {
  return apiClient
    .delete(endpoints.ATTRIBUTE(id))
    .then((response) => parseMessage(response));
};

const createAttributeValue = (data: VariationValueFormPayload) => {
  return apiClient
    .post(endpoints.ATTRIBUTE_VALUES(data.attribute_id), data)
    .then((response) => parseResponse(AttributeValueSchema, response));
};

const updateAttributeValue = (params: VariationValueFormPayload) => {
  const { attribute_id, value_id, value, color } = params;
  return apiClient
    .put(endpoints.ATTRIBUTE_VALUE(attribute_id, value_id!), { value, color })
    .then((response) => parseResponse(AttributeValueSchema, response));
};

const deleteAttributeValue = (params: { attribute_id: number; value_id: number }) => {
  return apiClient
    .delete(endpoints.ATTRIBUTE_VALUE(params.attribute_id, params.value_id))
    .then((response) => parseMessage(response));
};

const bulkDeleteAttributeValues = ({
  action = 'delete',
  attribute_id,
  ids = [],
}: BulkActionParams & { attribute_id: number }) => {
  return apiClient
    .post(endpoints.ATTRIBUTE_VALUES_BULK(attribute_id), { action, ids })
    .then((response) => parseMessage(response));
};

const useAttributesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: attributeKeys.list(params),
    queryFn: () => getAttributes(params),
    placeholderData: keepPreviousData,
  });
};

const useAttributeQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: attributeKeys.detail(id),
    queryFn: () => getAttribute(id),
    enabled: enabled && Boolean(id),
  });
};

const useAttributeValuesQuery = (
  id: number,
  params: ListQueryParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: attributeKeys.values(id, params),
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: attributeKeys.valuesLists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: attributeKeys.valuesLists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: attributeKeys.valuesLists() });
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
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: attributeKeys.valuesLists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  bulkDeleteAttributeValues, createAttribute, createAttributeValue, deleteAttribute, deleteAttributeValue, getAttribute, getAttributes, getAttributeValues, updateAttribute, updateAttributeValue, useAttributeQuery, useAttributesQuery, useAttributeValuesQuery, useBulkDeleteAttributeValuesMutation, useCreateAttributeMutation, useCreateAttributeValueMutation, useDeleteAttributeMutation, useDeleteAttributeValueMutation, useUpdateAttributeMutation, useUpdateAttributeValueMutation,
};

