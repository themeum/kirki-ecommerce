import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import {
  type SetupChecklist,
  SetupChecklistSchema,
  type SetupStepId,
} from '@/features/home/schemas/catalog/setup-checklist';
import { apiClient } from '@/libs/api';
import { parseData, parseResponse, toastMutationError } from '@/services/helpers';

const homeKeys = {
  setupChecklist: ['SetupChecklist'] as const,
};

const getSetupChecklist = () => {
  return apiClient
    .get(endpoints.SETUP_CHECKLIST)
    .then((response) => parseData(SetupChecklistSchema, response));
};

const completeSetupStep = (step: SetupStepId) => {
  return apiClient
    .post(endpoints.SETUP_CHECKLIST_COMPLETE_STEP(step))
    .then((response) => parseResponse(SetupChecklistSchema, response));
};

const useSetupChecklistQuery = () => {
  return useQuery({
    queryKey: homeKeys.setupChecklist,
    queryFn: getSetupChecklist,
    staleTime: 0,
  });
};

const useCompleteSetupStepMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeSetupStep,
    onSuccess(response) {
      queryClient.setQueryData<SetupChecklist>(homeKeys.setupChecklist, response.data);
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export { useCompleteSetupStepMutation, useSetupChecklistQuery };
