import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/api';
import { endpoints } from '@/libs/endpoints';
import { queryKeys, type QueryParams } from '@/libs/query-keys';
import { CountrySchema } from '@/schemas/reference/country';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';

const getCountries = (params: QueryParams = {}) => {
  return apiClient
    .get(endpoints.COUNTRIES, { params })
    .then((response) =>
      parseData(ResourceCollectionSchema(CountrySchema), response),
    );
};

const useCountriesQuery = (params: QueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.Countries(params),
    queryFn: () => getCountries(params),
    placeholderData: keepPreviousData,
  });
};

export { getCountries, useCountriesQuery };
