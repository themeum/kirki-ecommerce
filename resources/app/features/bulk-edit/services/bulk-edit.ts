import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { bulkEditKeys } from '@/features/bulk-edit';
import { inventoryKeys } from '@/features/inventory';
import { productKeys } from '@/features/products';
import { apiClient } from '@/libs/api';
import { VariantSchema } from '@/schemas/catalog/variant';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData, parseResponse, toastMutationError, toastMutationSuccess } from '@/services/helpers';
import type { ListQueryParams } from '@/types/list-state';
import { __ } from '@/wpi18n';

const getBulkVariants = (
  ids: (string | number)[],
  params: ListQueryParams = {},
) => {
  return apiClient
    .get(endpoints.VARIANTS_BULK_BY_IDS(ids), { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(VariantSchema), response),
    );
};

const updateBulkVariants = (data: Record<string, unknown>) => {
  return apiClient
    .put(endpoints.VARIANTS_BULK, data)
    .then((response) =>
      parseResponse(ResourceCollectionSchema(VariantSchema), response),
    );
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
      toastMutationSuccess(
        response.message ||
        __('Variants updated successfully.', 'kirki-ecommerce'),
      );
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
  getBulkVariants,
  updateBulkVariants,
  useBulkVariantsQuery,
  useUpdateBulkVariantsMutation,
};

