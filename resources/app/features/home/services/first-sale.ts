import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { type FirstSale, FirstSaleSchema } from '@/features/home/schemas/catalog/first-sale';
import { apiClient } from '@/libs/api';
import { parseData, toastMutationError } from '@/services/helpers';

const firstSaleKeys = {
  state: ['FirstSale'] as const,
};

const getFirstSale = () => {
  return apiClient
    .get(endpoints.HOME_FIRST_SALE)
    .then((response) => parseData(FirstSaleSchema, response));
};

const postFirstSale = (endpoint: string) => {
  return apiClient.post(endpoint).then((response) => parseData(FirstSaleSchema, response));
};

const useFirstSaleQuery = () => {
  return useQuery({
    queryKey: firstSaleKeys.state,
    queryFn: getFirstSale,
    staleTime: 0,
  });
};

const useFirstSaleCelebratedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postFirstSale(endpoints.HOME_FIRST_SALE_CELEBRATED),
    onSuccess(state) {
      queryClient.setQueryData<FirstSale>(firstSaleKeys.state, state);
    },
  });
};

const useFirstSaleDismissMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postFirstSale(endpoints.HOME_FIRST_SALE_DISMISS),
    onMutate() {
      queryClient.setQueryData<FirstSale>(firstSaleKeys.state, (current) =>
        current ? { ...current, is_visible: false, should_celebrate: false } : current,
      );
    },
    onSuccess(state) {
      queryClient.setQueryData<FirstSale>(firstSaleKeys.state, state);
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

const useFirstSaleFulfillMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postFirstSale(endpoints.HOME_FIRST_SALE_FULFILL),
    onSuccess(state) {
      queryClient.setQueryData<FirstSale>(firstSaleKeys.state, state);
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export {
  useFirstSaleCelebratedMutation,
  useFirstSaleDismissMutation,
  useFirstSaleFulfillMutation,
  useFirstSaleQuery,
};
