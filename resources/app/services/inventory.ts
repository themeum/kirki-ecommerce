import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { unwrapData } from '@/services/helpers';
import type { InventoryVariant, PaginatedData } from '@/types';

const getInventory = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.VARIANTS, { params })
    .then((response) => unwrapData<PaginatedData<InventoryVariant>>(response));
};

const useInventoryQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Inventory(params),
    queryFn: () => getInventory(params),
    placeholderData: keepPreviousData,
  });
};

export { getInventory, useInventoryQuery };
