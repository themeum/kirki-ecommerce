import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type { ListQueryParams, SettingsSectionData, SettingsSectionKey } from '@/types';
import { __ } from '@/wpi18n';

const getSettings = (key: SettingsSectionKey | string, params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.SETTINGS_BY_KEY(key), { params })
    .then((response) => unwrapData<SettingsSectionData>(response));
};

const getDefaultSettings = () => {
  return apiClient
    .get(endpoints.APP_CONFIG)
    .then((response) => unwrapData<SettingsSectionData>(response));
};

const updateSettings = ({
  key,
  data,
}: {
  key: string;
  data: SettingsSectionData;
}) => {
  return apiClient
    .put(endpoints.SETTINGS, { key, data })
    .then((response) => unwrapResponse<SettingsSectionData>(response));
};

const useSettingsQuery = (
  key: SettingsSectionKey | string,
  params: ListQueryParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.Settings(key),
    queryFn: () => getSettings(key, params),
    enabled,
  });
};

const useDefaultSettingsQuery = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.DefaultSettings(),
    queryFn: getDefaultSettings,
    enabled,
  });
};

const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess(response, variables) {
      toastMutationSuccess(
        response.message ||
          __('Settings updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.Settings(variables.key),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.DefaultSettings(),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getSettings,
  getDefaultSettings,
  updateSettings,
  useSettingsQuery,
  useDefaultSettingsQuery,
  useUpdateSettingsMutation,
};
