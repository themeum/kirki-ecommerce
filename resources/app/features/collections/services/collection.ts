import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { collectionKeys } from '@/features/collections/index';
import { CollectionSchema } from '@/features/collections/schemas/catalog/collection';
import type { CollectionFormPayload } from '@/features/collections/schemas/forms/collection-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { BulkActionParams } from '@/types/api/result';
import type { ListQueryParams } from '@/types/list-state';
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

/**
 * The full collection details page sends a complete `CollectionFormPayload`,
 * but the inline "create collection" affordance in `CollectionsField` only
 * ever sends `title` — the backend derives the rest server-side.
 */
const createCollection = (
  data: CollectionFormPayload | Pick<CollectionFormPayload, 'title'>,
) => {
  return apiClient
    .post(endpoints.COLLECTIONS, data)
    .then((response) => parseResponse(CollectionSchema, response));
};

const updateCollection = ({
  id,
  data,
}: {
  id: number;
  data: CollectionFormPayload;
}) => {
  return apiClient
    .put(endpoints.COLLECTION(id), data)
    .then((response) => parseResponse(CollectionSchema, response));
};

const deleteCollection = (id: number) => {
  return apiClient
    .delete(endpoints.COLLECTION(id))
    .then((response) => parseMessage(response));
};

const bulkDeleteCollections = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.COLLECTIONS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

const useCollectionsQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: collectionKeys.list(params),
    queryFn: () => getCollections(params),
    placeholderData: keepPreviousData,
  });
};

const useCollectionQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: collectionKeys.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.id),
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
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
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
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  bulkDeleteCollections, createCollection, deleteCollection, getCollection, getCollections, updateCollection, useBulkDeleteCollectionsMutation, useCollectionQuery, useCollectionsQuery, useCreateCollectionMutation, useDeleteCollectionMutation, useUpdateCollectionMutation,
};

