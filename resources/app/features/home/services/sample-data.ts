import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/config/endpoints';
import { apiClient } from '@/libs/api';
import { parseResponse, toastMutationError } from '@/services/helpers';

const importSampleData = () => {
  return apiClient
    .post(endpoints.ONBOARDING_SAMPLE_DATA)
    .then((response) => parseResponse(z.unknown(), response));
};

const useImportSampleDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importSampleData,
    onSuccess() {
      return queryClient.invalidateQueries();
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export { useImportSampleDataMutation };
