import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { unwrapData } from '@/services/helpers';
import type { PageItem, PaginatedData } from '@/types';

const getPages = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.PAGES, { params })
    .then((response) =>
      unwrapData<PageItem[] | PaginatedData<PageItem>>(response),
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
