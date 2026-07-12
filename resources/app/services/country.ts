import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { unwrapData } from '@/services/helpers';
import type { Country } from '@/types';

const getCountries = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.COUNTRIES, { params })
    .then((response) => unwrapData<Country[]>(response));
};

const useCountriesQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Countries(params),
    queryFn: () => getCountries(params),
    placeholderData: keepPreviousData,
  });
};

export { getCountries, useCountriesQuery };
