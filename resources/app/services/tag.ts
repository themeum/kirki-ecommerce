import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import { TagSchema } from '@/schemas/catalog/tag';
import type { TagFormPayload } from '@/schemas/forms/tag-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams, BulkActionParams } from '@/types';
import { __ } from '@/wpi18n';

const getTags = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.TAGS, { params })
    .then((response) => parseData(PaginatedDataSchema(TagSchema), response));
};

/**
 * The full add/edit dialog always sends a complete `TagFormPayload`, but the
 * inline "create tag" affordance in `TagsField` sends only a name — the
 * backend derives the slug server-side in that case.
 */
const createTag = (data: TagFormPayload | Pick<TagFormPayload, 'name'>) => {
  return apiClient
    .post(endpoints.TAGS, data)
    .then((response) => parseResponse(TagSchema, response));
};

const updateTag = ({ id, data }: { id: number; data: TagFormPayload }) => {
  return apiClient
    .put(endpoints.TAG(id), data)
    .then((response) => parseResponse(TagSchema, response));
};

const deleteTag = (id: number) => {
  return apiClient
    .delete(endpoints.TAG(id))
    .then((response) => parseMessage(response));
};

const bulkDeleteTags = ({
  action = 'delete',
  ids = [],
}: BulkActionParams = {}) => {
  return apiClient
    .post(endpoints.TAGS_BULK, { action, ids })
    .then((response) => parseMessage(response));
};

const useTagsQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Tags(params),
    queryFn: () => getTags(params),
    placeholderData: keepPreviousData,
  });
};

const useCreateTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Tag created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Tags'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTag,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Tag updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Tags'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Tag deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Tags'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkDeleteTagsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteTags,
    onSuccess(response) {
      toastMutationSuccess(
        response.message || __('Tags deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['Tags'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  bulkDeleteTags,
  useTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useBulkDeleteTagsMutation,
};
