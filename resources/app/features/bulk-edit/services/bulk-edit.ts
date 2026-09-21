import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import { bulkEditKeys } from '@/features/bulk-edit';
import { inventoryKeys } from '@/features/inventory';
import { productKeys } from '@/features/products';
import { VariantSchema } from '@/features/products';
import { apiClient } from '@/libs/api';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import {
  parseData,
  parseResponse,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getBulkVariants = (ids: (string | number)[], params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.VARIANTS_BULK_BY_IDS(ids), { params })
    .then((response) => parseData(ResourceCollectionSchema(VariantSchema), response));
};

const updateBulkVariants = (data: Record<string, unknown>) => {
  return apiClient
    .put(endpoints.VARIANTS_BULK, data)
    .then((response) => parseResponse(ResourceCollectionSchema(VariantSchema), response));
};

const GeneratedSkusSchema = z.array(
  z.object({
    variant_id: z.number(),
    sku: z.string(),
  }),
);

/**
 * One request for the whole set rather than one per row: the sequence is read
 * off the stored SKUs and nothing is persisted until the merchant saves, so
 * separate calls would each read the same maximum and return the same number.
 */
const generateVariantSkus = (variantIds: number[]) => {
  return apiClient
    .post(endpoints.VARIANTS_GENERATE_SKUS, { variant_ids: variantIds })
    .then((response) => parseResponse(GeneratedSkusSchema, response));
};

const useGenerateVariantSkusMutation = () => {
  return useMutation({
    mutationFn: generateVariantSkus,
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useBulkVariantsQuery = (
  ids: (string | number)[],
  params: ListQueryParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: bulkEditKeys.list(ids, params),
    queryFn: () => getBulkVariants(ids, params),
    enabled: enabled && ids.length > 0,
    placeholderData: keepPreviousData,
  });
};

const useUpdateBulkVariantsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBulkVariants,
    onSuccess(response) {
      toastMutationSuccess(response.message || __('Variants updated', 'kirki-ecommerce'));
      void queryClient.invalidateQueries({ queryKey: bulkEditKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  generateVariantSkus,
  getBulkVariants,
  updateBulkVariants,
  useBulkVariantsQuery,
  useGenerateVariantSkusMutation,
  useUpdateBulkVariantsMutation,
};
