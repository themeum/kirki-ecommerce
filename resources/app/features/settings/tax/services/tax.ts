import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { taxKeys } from '@/features/settings';
import { TaxProfileSchema } from '@/features/settings/tax/schemas/catalog/tax';
import type { TaxProfileFormPayload } from '@/features/settings/tax/schemas/forms/tax-profile-form';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData, parseMessage, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getTaxProfiles = async (params: ListQueryParams = {}) => {
  const data = await apiClient
    .get(endpoints.TAX_PROFILES, { params })
    .then((response) => parseData(PaginatedDataSchema(TaxProfileSchema), response));
  return data.results;
};

const createTaxProfile = (data: TaxProfileFormPayload) => {
  return apiClient
    .post(endpoints.TAX_PROFILES, data)
    .then((response) => parseResponse(TaxProfileSchema, response));
};

const updateTaxProfile = ({
  id,
  data,
}: {
  id: string | number;
  data: TaxProfileFormPayload;
}) => {
  return apiClient
    .put(endpoints.TAX_PROFILE(id), data)
    .then((response) => parseResponse(TaxProfileSchema, response));
};

const deleteTaxProfile = (id: string | number) => {
  return apiClient
    .delete(endpoints.TAX_PROFILE(id))
    .then((response) => parseMessage(response));
};

const useTaxProfilesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: taxKeys.list(params),
    queryFn: () => getTaxProfiles(params),
    placeholderData: keepPreviousData,
  });
};

const useCreateTaxProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Tax profile created successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateTaxProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Tax profile updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useDeleteTaxProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxProfile,
    onSuccess(response) {
      toastMutationSuccess(
        response.message ||
        __('Tax profile deleted successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  createTaxProfile, deleteTaxProfile, getTaxProfiles, updateTaxProfile, useCreateTaxProfileMutation, useDeleteTaxProfileMutation, useTaxProfilesQuery, useUpdateTaxProfileMutation,
};

