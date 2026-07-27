import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type { ListQueryParams, PaginatedData, ShippingBox, ShippingProfile } from '@/types';
import { __ } from '@/wpi18n';

const getShippingProfiles = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.SHIPPING_PROFILES, { params })
    .then((response) => unwrapData<PaginatedData<ShippingProfile>>(response));
  return data.results;
};

const createShippingProfile = (data: Record<string, unknown>) => {
  return apiClient
    .post(endpoints.SHIPPING_PROFILES, data)
    .then((response) => unwrapResponse<ShippingProfile>(response));
};

const updateShippingProfile = ({
  id,
  data,
}: {
  id: string | number;
  data: Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.SHIPPING_PROFILE(id), data)
    .then((response) => unwrapResponse<ShippingProfile>(response));
};

const deleteShippingProfile = (id: string | number) => {
  return apiClient
    .delete(endpoints.SHIPPING_PROFILE(id))
    .then((response) => unwrapResponse(response));
};

const getShippingBoxes = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.SHIPPING_BOXES, { params })
    .then((response) => unwrapData<PaginatedData<ShippingBox>>(response));
  return data.results;
};

const getShippingBox = (id: string | number) => {
  return apiClient
    .get(endpoints.SHIPPING_BOX(id))
    .then((response) => unwrapData<ShippingBox>(response));
};

const createShippingBox = (data: Record<string, unknown>) => {
  return apiClient
    .post(endpoints.SHIPPING_BOXES, data)
    .then((response) => unwrapResponse<ShippingBox>(response));
};

const updateShippingBox = ({
  id,
  data,
}: {
  id: string | number;
  data: Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.SHIPPING_BOX(id), data)
    .then((response) => unwrapResponse<ShippingBox>(response));
};

const deleteShippingBox = (id: string | number) => {
  return apiClient
    .delete(endpoints.SHIPPING_BOX(id))
    .then((response) => unwrapResponse(response));
};

const useShippingProfilesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.ShippingProfiles(params),
    queryFn: () => getShippingProfiles(params),
    placeholderData: keepPreviousData,
  });
};

const useShippingBoxesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.ShippingBoxes(params),
    queryFn: () => getShippingBoxes(params),
    placeholderData: keepPreviousData,
  });
};

const useShippingBoxQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.ShippingBox(id),
    queryFn: () => getShippingBox(id),
    enabled: enabled && Boolean(id),
  });
};

const useCreateShippingProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShippingProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Shipping profile created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingProfiles'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateShippingProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShippingProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Shipping profile updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingProfiles'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteShippingProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShippingProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Shipping profile deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingProfiles'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useCreateShippingBoxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShippingBox,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Shipping box created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingBoxes'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateShippingBoxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShippingBox,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
          __('Shipping box updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingBoxes'] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.ShippingBox(variables.id),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteShippingBoxMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShippingBox,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
          __('Shipping box deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: ['ShippingBoxes'] });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getShippingProfiles,
  createShippingProfile,
  updateShippingProfile,
  deleteShippingProfile,
  getShippingBoxes,
  getShippingBox,
  createShippingBox,
  updateShippingBox,
  deleteShippingBox,
  useShippingProfilesQuery,
  useShippingBoxesQuery,
  useShippingBoxQuery,
  useCreateShippingProfileMutation,
  useUpdateShippingProfileMutation,
  useDeleteShippingProfileMutation,
  useCreateShippingBoxMutation,
  useUpdateShippingBoxMutation,
  useDeleteShippingBoxMutation,
};
