import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import {
  toastMutationError,
  toastMutationSuccess,
  unwrapData,
  unwrapResponse,
} from '@/services/helpers';
import type { ProductVariant } from '@/types';
import { __ } from '@/wpi18n';

const getBulkVariants = (
  ids: Array<string | number>,
  params: QueryParams = {},
) => {
  return apiClient
    .get(endpoints.VARIANTS_BULK_BY_IDS(ids), { params })
    .then((response) => unwrapData<ProductVariant[]>(response));
};

const updateBulkVariants = (data: Record<string, unknown>) => {
  return apiClient
    .put(endpoints.VARIANTS_BULK, data)
    .then((response) => unwrapResponse(response));
};

const useBulkVariantsQuery = (
  ids: Array<string | number>,
  params: QueryParams = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.BulkVariants(ids, params),
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
      void queryClient.invalidateQueries({ queryKey: ['BulkVariants'] });
      void queryClient.invalidateQueries({ queryKey: ['Inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['Products'] });
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
