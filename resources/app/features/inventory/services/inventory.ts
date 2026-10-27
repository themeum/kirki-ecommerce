import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import { bulkEditKeys } from '@/features/bulk-edit';
import { inventoryKeys } from '@/features/inventory';
import type { VariantFormPayload } from '@/features/inventory/schemas/forms/variant-form';
import type { InventoryListFilter } from '@/features/inventory/types';
import { InventoryVariantSchema, productKeys, VariantSchema } from '@/features/products';
import { apiClient } from '@/libs/api';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';
import type { ListParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getInventory = (params: ListParams<InventoryListFilter> = {}) => {
  return apiClient
    .get(endpoints.VARIANTS, { params })
    .then((response) => parseData(PaginatedDataSchema(InventoryVariantSchema), response));
};

const getVariant = (id: number) => {
  return apiClient
    .get(endpoints.VARIANT(id))
    .then((response) => parseData(VariantSchema, response));
};

const updateVariant = ({ id, data }: { id: number; data: VariantFormPayload }) => {
  return apiClient
    .put(endpoints.VARIANT(id), data)
    .then((response) => parseResponse(VariantSchema, response));
};

const useInventoryQuery = (params: ListParams<InventoryListFilter> = {}) => {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => getInventory(params),
    placeholderData: keepPreviousData,
  });
};

const useVariantQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => getVariant(id),
    enabled: enabled && Boolean(id),
  });
};

const GenerateSkuResponseSchema = z.object({
  sku: z.string(),
});

type GenerateSkuPayload = {
  variant_id?: number;
  title?: string | null;
  brand_id?: number | null;
  category_ids?: number[];
  attribute_value_ids?: number[];
};

const generateSku = (payload: GenerateSkuPayload) => {
  return apiClient
    .post(endpoints.VARIANT_GENERATE_SKU, payload)
    .then((response) => parseResponse(GenerateSkuResponseSchema, response));
};

const useGenerateSkuMutation = () => {
  return useMutation({
    mutationFn: generateSku,
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useUpdateVariantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVariant,
    onSuccess(response, variables) {
      toastMutationSuccess(response.message || __('Variant updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bulkEditKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  generateSku,
  type GenerateSkuPayload,
  getInventory,
  getVariant,
  updateVariant,
  useGenerateSkuMutation,
  useInventoryQuery,
  useUpdateVariantMutation,
  useVariantQuery,
};
