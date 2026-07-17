import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { PageItemSchema } from '@/schemas/catalog/page';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';

const getPages = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.PAGES, { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(PageItemSchema), response),
    );
};

const usePagesQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Pages(params),
    queryFn: () => getPages(params),
    placeholderData: keepPreviousData,
  });
};

export { getPages, usePagesQuery };
