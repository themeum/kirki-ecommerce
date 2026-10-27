import { useMutation, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import { clearDraft } from '@/features/onboarding/lib/onboarding-draft';
import { markOnboarded } from '@/features/onboarding/lib/onboarding-status';
import { StoreSetupSummarySchema } from '@/features/onboarding/schemas/catalog/store-setup';
import type { OnboardingFormPayload } from '@/features/onboarding/schemas/forms/onboarding-form';
import { apiClient } from '@/libs/api';
import { parseResponse } from '@/services/helpers';

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

export { useCreateStoreMutation };
