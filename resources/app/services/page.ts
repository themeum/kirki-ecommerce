import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { PageItemSchema } from '@/schemas/catalog/page';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';
import type { ListQueryParams } from '@/types';

const getPages = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.PAGES, { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(PageItemSchema), response),
    );
};

const usePagesQuery = (params: ListQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Pages(params),
    queryFn: () => getPages(params),
    placeholderData: keepPreviousData,
  });
};

export { getPages, usePagesQuery };
