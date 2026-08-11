import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { queryKeys } from '@/libs/query-keys';
import { CountrySchema } from '@/schemas/reference/country';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';
import type { ListQueryParams } from '@/types';

const getCountries = (params: ListQueryParams = {}) => {
  return apiClient
    .get(endpoints.COUNTRIES, { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(CountrySchema), response),
    );
};

const useCountriesQuery = (params: ListQueryParams = {}, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Countries(params),
    queryFn: () => getCountries(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export { getCountries, useCountriesQuery };
