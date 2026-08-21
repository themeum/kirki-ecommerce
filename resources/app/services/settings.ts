import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { endpoints } from '@/config/endpoints';
/**
 * This service backs the generic per-section settings CRUD and stays at
 * root (see design.md's "genuine wart" note) rather than moving into
 * features/settings/ — but SettingsPayloadMap below necessarily names every
 * section's real form payload type, so it structurally cannot avoid
 * depending on the settings sub-features. Same accepted exception as
 * schemas/catalog/settings.ts's SettingsSchemaMap.
 */
// eslint-disable-next-line no-restricted-imports -- see comment above
import type {
  CheckoutSettingsFormPayload,
  EmailSettingsFormPayload,
  GeneralSettingsFormPayload,
  MultiCurrencySettingsFormPayload,
  ProductsSettingsFormPayload,
  ShippingSettingsFormPayload,
  TaxSettingsFormPayload,
} from '@/features/settings';
import { apiClient } from '@/libs/api';
import { defaultSettingsKeys, settingsKeys } from '@/libs/query-keys';
import { AppConfigSchema } from '@/schemas/catalog/app-config';
import { SettingsSchemaMap, type SettingsSectionKey } from '@/schemas/catalog/settings';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
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

/**
 * The cast re-attaches the section's own output type. Indexing the schema map
 * with a still-generic `K` gives TypeScript a union of all eight schemas, which
 * it widens to `{}` when inferring `parseData`'s output; naming the type here
 * keeps every caller of `useSettingsQuery('general')` fully typed.
 */
const getSettings = <K extends SettingsSectionKey>(
  key: K,
  params: ListQueryParams = {},
): Promise<z.infer<(typeof SettingsSchemaMap)[K]>> => {
  return apiClient
    .get(endpoints.SETTINGS_BY_KEY(key), { params })
    .then(
      (response) =>
        parseData(SettingsSchemaMap[key], response) as z.infer<
          (typeof SettingsSchemaMap)[K]
        >,
    );
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
    queryKey: settingsKeys.section(key),
    queryFn: () => getSettings(key, params),
    enabled,
  });
};

const useDefaultSettingsQuery = (enabled = true) => {
  return useQuery({
    queryKey: defaultSettingsKeys.all,
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
        queryKey: settingsKeys.section(variables.key),
      });
      void queryClient.invalidateQueries({
        queryKey: defaultSettingsKeys.all,
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  getDefaultSettings, getSettings, updateSettings, useDefaultSettingsQuery, useSettingsQuery, useUpdateSettingsMutation,
};

