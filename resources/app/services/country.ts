import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { cacheAddressRules } from '@/libs/address-rules';
import { apiClient } from '@/libs/api';
import { countryKeys } from '@/libs/query-keys';
import type { CountryListFilter } from '@/schemas/reference/country';
import { CountrySchema } from '@/schemas/reference/country';
import { ResourceCollectionSchema } from '@/schemas/shared/api';
import { parseData } from '@/services/helpers';

const getCountries = (params: CountryListFilter = {}) => {
  return apiClient
    .get(endpoints.COUNTRIES, { params })
    .then((response) => parseData(ResourceCollectionSchema(CountrySchema), response))
    .then((countries) => {
      cacheAddressRules(countries);
      return countries;
    });
};

const useCountriesQuery = (params: CountryListFilter = {}, enabled = true) => {
  return useQuery({
    queryKey: countryKeys.list(params),
    queryFn: () => getCountries(params),
    placeholderData: keepPreviousData,
    enabled,
  });
};

export { getCountries, useCountriesQuery };
