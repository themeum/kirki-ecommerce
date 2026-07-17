import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { InventoryVariantSchema } from '@/schemas/catalog/variant';
import { PaginatedDataSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';

const getInventory = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.VARIANTS, { params })
    .then((response) =>
      parseData(PaginatedDataSchema(InventoryVariantSchema), response),
    );
};

const useInventoryQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Inventory(params),
    queryFn: () => getInventory(params),
    placeholderData: keepPreviousData,
  });
};

export { getInventory, useInventoryQuery };
