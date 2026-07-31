import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { CollectionSchema } from '@/schemas/catalog/collection';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess, unwrapResponse } from '@/services/helpers';
import type { ListQueryParams, BulkActionParams, CollectionFormData } from '@/types';
import { __ } from '@/wpi18n';

const getCollections = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.COLLECTIONS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(CollectionSchema), response),
    );
};

const getCollection = (id: number) => {
  return apiClient
    .get(endpoints.COLLECTION(id))
    .then((response) => parseData(CollectionSchema, response));
};

const createCollection = (data: CollectionFormData) => {
  return apiClient
    .post(endpoints.COLLECTIONS, data)
    .then((response) => parseResponse(CollectionSchema, response));
};

const updateCollection = ({
  id,
  data,
}: {
  id: number;
  data: CollectionFormData;
}) => {
  return apiClient
    .put(endpoints.COLLECTION(id), data)
    .then((response) => parseResponse(CollectionSchema, response));
};

const deleteCollection = (id: number) => {
  return apiClient
    .delete(endpoints.COLLECTION(id))
    .then((response) => unwrapResponse(response));
};

const bulkDeleteCollections = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.COLLECTIONS_BULK, { action, ids })
    .then((response) => unwrapResponse(response));
};

const useCollectionsQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Collections(params),
    queryFn: () => getCollections(params),
    placeholderData: keepPreviousData,
  });
};

const useCollectionQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Collection(id),
    queryFn: () => getCollection(id),
    enabled: enabled && Boolean(id),
  });
};

const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCollection,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Collection created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Collections'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCollection,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
          __('Collection updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Collections'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Collection(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCollection,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Collection deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Collections'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteCollectionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteCollections,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Collections deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Collections'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  bulkDeleteCollections,
  useCollectionsQuery,
  useCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useBulkDeleteCollectionsMutation,
};
