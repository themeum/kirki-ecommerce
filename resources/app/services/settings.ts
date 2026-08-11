import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { AppConfigSchema } from '@/schemas/catalog/app-config';
import { SettingsSchemaMap, type SettingsSectionKey } from '@/schemas/catalog/settings';
import type { CheckoutSettingsFormPayload } from '@/schemas/forms/checkout-settings-form';
import type { EmailSettingsFormPayload } from '@/schemas/forms/email-settings-form';
import type { GeneralSettingsFormPayload } from '@/schemas/forms/general-settings-form';
import type { MultiCurrencySettingsFormPayload } from '@/schemas/forms/multi-currency-settings-form';
import type { ProductsSettingsFormPayload } from '@/schemas/forms/products-settings-form';
import type { ShippingSettingsFormPayload } from '@/schemas/forms/shipping-settings-form';
import type { TaxSettingsFormPayload } from '@/schemas/forms/tax-settings-form';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types';
import { __ } from '@/wpi18n';

/**
 * Only the 7 sections converted to a canonical form schema are writable.
 * `payment` is readable (see `schemas/catalog/settings.ts`) but has no form
 * schema — payment settings are written through `services/payment.ts`'s
 * dedicated gateway/method endpoints instead of the generic settings PUT.
 */
type SettingsPayloadMap = {
  general: GeneralSettingsFormPayload;
  product: ProductsSettingsFormPayload;
  checkout: CheckoutSettingsFormPayload;
  email: EmailSettingsFormPayload;
  shipping: ShippingSettingsFormPayload;
  tax: TaxSettingsFormPayload;
  currency: MultiCurrencySettingsFormPayload;
};

const getSettings = <K extends SettingsSectionKey>(key: K, params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.SETTINGS_BY_KEY(key), { params })
    .then((response) => parseData(SettingsSchemaMap[key], response));
};

const getDefaultSettings = () => {
  return apiClient
    .get(endpoints.APP_CONFIG)
    .then((response) => parseData(AppConfigSchema, response));
};

const updateSettings = <K extends keyof SettingsPayloadMap>({
  key,
  data,
}: {
  key: K;
  data: SettingsPayloadMap[K];
}) => {
  return apiClient
    .put(endpoints.SETTINGS, { key, data })
    .then((response) => parseResponse(SettingsSchemaMap[key], response));
};

const useSettingsQuery = <K extends SettingsSectionKey>(
  key: K,
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

const useUpdateSettingsMutation = <K extends keyof SettingsPayloadMap>() => {
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
  getDefaultSettings, getSettings, updateSettings, useDefaultSettingsQuery, useSettingsQuery, useUpdateSettingsMutation
};

