import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { InventoryVariantSchema } from '@/schemas/catalog/variant';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';
import type { ListQueryParams } from '@/types';

const getInventory = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.VARIANTS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(InventoryVariantSchema), response),
    );
};

const useInventoryQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Inventory(params),
    queryFn: () => getInventory(params),
    placeholderData: keepPreviousData,
  });
};

export { getInventory, useInventoryQuery };
