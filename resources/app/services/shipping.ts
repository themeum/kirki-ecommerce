import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { shippingKeys } from '@/features/settings';
import { apiClient } from '@/libs/api';
import { ShippingBoxSchema, ShippingProfileSchema } from '@/schemas/catalog/shipping';
import type { ShippingBoxFormPayload } from '@/schemas/forms/shipping-box-form';
import type { ShippingProfileFormPayload } from '@/schemas/forms/shipping-profile-form';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getShippingProfiles = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.SHIPPING_PROFILES, { params })
    .then((response) => parseData(PaginatedDataSchema(ShippingProfileSchema), response));
  return data.results;
};

const createShippingProfile = (data: ShippingProfileFormPayload) => {
  return apiClient
    .post(endpoints.SHIPPING_PROFILES, data)
    .then((response) => parseResponse(ShippingProfileSchema, response));
};

const updateShippingProfile = ({
  id,
  data,
}: {
  id: string | number;
  data: ShippingProfileFormPayload;
}) => {
  return apiClient
    .put(endpoints.SHIPPING_PROFILE(id), data)
    .then((response) => parseResponse(ShippingProfileSchema, response));
};

const deleteShippingProfile = (id: string | number) => {
  return apiClient
    .delete(endpoints.SHIPPING_PROFILE(id))
    .then((response) => parseMessage(response));
};

const getShippingBoxes = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.SHIPPING_BOXES, { params })
    .then((response) => parseData(PaginatedDataSchema(ShippingBoxSchema), response));
  return data.results;
};

const getShippingBox = (id: string | number) => {
  return apiClient
    .get(endpoints.SHIPPING_BOX(id))
    .then((response) => parseData(ShippingBoxSchema, response));
};

const createShippingBox = (data: ShippingBoxFormPayload) => {
  return apiClient
    .post(endpoints.SHIPPING_BOXES, data)
    .then((response) => parseResponse(ShippingBoxSchema, response));
};

const updateShippingBox = ({
  id,
  data,
}: {
  id: string | number;
  data: ShippingBoxFormPayload | Record<string, unknown>;
}) => {
  return apiClient
    .put(endpoints.SHIPPING_BOX(id), data)
    .then((response) => parseResponse(ShippingBoxSchema, response));
};

const deleteShippingBox = (id: string | number) => {
  return apiClient
    .delete(endpoints.SHIPPING_BOX(id))
    .then((response) => parseMessage(response));
};

const useShippingProfilesQuery = (params: ListQueryParams = {}, enabled = true) => {
  return useQuery({
    queryKey: shippingKeys.profiles.list(params),
    queryFn: () => getShippingProfiles(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

const useShippingBoxesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: shippingKeys.boxes.list(params),
    queryFn: () => getShippingBoxes(params),
    placeholderData: keepPreviousData,
  });
};

const useShippingBoxQuery = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: shippingKeys.boxes.detail(id),
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.profiles.all });
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.profiles.all });
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.profiles.all });
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.boxes.lists() });
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.boxes.lists() });
      void queryClient.invalidateQueries({
        queryKey: shippingKeys.boxes.detail(variables.id),
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
      void queryClient.invalidateQueries({ queryKey: shippingKeys.boxes.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  createShippingBox, createShippingProfile, deleteShippingBox, deleteShippingProfile, getShippingBox, getShippingBoxes, getShippingProfiles, updateShippingBox, updateShippingProfile, useCreateShippingBoxMutation, useCreateShippingProfileMutation, useDeleteShippingBoxMutation, useDeleteShippingProfileMutation, useShippingBoxesQuery,
  useShippingBoxQuery, useShippingProfilesQuery, useUpdateShippingBoxMutation, useUpdateShippingProfileMutation,
};

