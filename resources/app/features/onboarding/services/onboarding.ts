import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { clearDraft } from '@/features/onboarding/lib/onboarding-draft';
import { markOnboarded } from '@/features/onboarding/lib/onboarding-status';
import { OnboardingDefaultsSchema } from '@/features/onboarding/schemas/catalog/onboarding-defaults';
import { StoreSetupSummarySchema } from '@/features/onboarding/schemas/catalog/store-setup';
import type { OnboardingFormPayload } from '@/features/onboarding/schemas/forms/onboarding-form';
import { apiClient } from '@/libs/api';
import { parseData, parseResponse } from '@/services/helpers';

const getDefaults = () => {
  return apiClient
    .get(endpoints.ONBOARDING_DEFAULTS)
    .then((response) => parseData(OnboardingDefaultsSchema, response));
};

const createStore = (data: OnboardingFormPayload) => {
  return apiClient
    .post(endpoints.ONBOARDING, data)
    .then((response) => parseResponse(StoreSetupSummarySchema, response));
};

const useCreateStoreMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStore,
    onSuccess() {
      clearDraft();
      markOnboarded();
      void queryClient.invalidateQueries();
    },
  });
};

const useOnboardingDefaultsQuery = () => {
  return useQuery({
    queryKey: ['OnboardingDefaults'],
    queryFn: getDefaults,
    retry: false,
    staleTime: Infinity,
  });
};

export { useCreateStoreMutation, useOnboardingDefaultsQuery };
