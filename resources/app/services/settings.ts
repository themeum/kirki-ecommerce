import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys } from '@/libs/query-keys';
import type { CheckoutSettingsFormPayload } from '@/schemas/forms/checkout-settings-form';
import type { EmailSettingsFormPayload } from '@/schemas/forms/email-settings-form';
import type { GeneralSettingsFormPayload } from '@/schemas/forms/general-settings-form';
import type { MultiCurrencySettingsFormPayload } from '@/schemas/forms/multi-currency-settings-form';
import type { ProductsSettingsFormPayload } from '@/schemas/forms/products-settings-form';
import type { ShippingSettingsFormPayload } from '@/schemas/forms/shipping-settings-form';
import type { TaxSettingsFormPayload } from '@/schemas/forms/tax-settings-form';
import { toastMutationError, toastMutationSuccess, unwrapData, unwrapResponse } from '@/services/helpers';
import type { ListQueryParams, SettingsSectionData, SettingsSectionKey } from '@/types';
import { __ } from '@/wpi18n';

/**
 * Only the 7 sections converted to a canonical form schema get a real
 * payload type here. `orders`/`payment`/`default` are never sent through
 * `updateSettings` today, so they fall back to the old catch-all rather
 * than being modeled speculatively.
 */
type SettingsPayloadMap = {
  general: GeneralSettingsFormPayload;
  product: ProductsSettingsFormPayload;
  checkout: CheckoutSettingsFormPayload;
  email: EmailSettingsFormPayload;
  shipping: ShippingSettingsFormPayload;
  tax: TaxSettingsFormPayload;
  currency: MultiCurrencySettingsFormPayload;
  orders: SettingsSectionData;
  payment: SettingsSectionData;
  default: SettingsSectionData;
};

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

const updateSettings = <K extends SettingsSectionKey>({
  key,
  data,
}: {
  key: K;
  data: SettingsPayloadMap[K];
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

const useUpdateSettingsMutation = <K extends SettingsSectionKey>() => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { key: K; data: SettingsPayloadMap[K] }) => updateSettings(variables),
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
