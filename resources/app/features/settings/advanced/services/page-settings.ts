import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/config/endpoints';
import type { Page } from '@/features/settings/advanced/schemas/catelog/page-settings';
import { PageSchema } from '@/features/settings/advanced/schemas/catelog/page-settings';
import { pageKeys } from '@/features/settings/advanced/services/query-keys';
import { apiClient } from '@/libs/api';
import { settingsKeys } from '@/libs/query-keys';
import {
  parseData,
  parseMessage,
  toastMutationError,
  toastMutationSuccess,
} from '@/services/helpers';
import { __ } from '@/wpi18n';

type PageParams = {
  status: string;
};

const getPages = (params?: PageParams): Promise<Page[]> => {
  return apiClient
    .get(endpoints.PAGES, { params })
    .then((response) => parseData(PageSchema.array(), response));
};

const usePagesQuery = (params?: PageParams, enabled = true) => {
  return useQuery({
    queryKey: pageKeys.lists(),
    queryFn: () => getPages(params),
    enabled,
  });
};

const fixPages = () => {
  return apiClient.post(endpoints.PAGES_FIX).then((response) => parseMessage(response));
};

const usePageRunFixMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fixPages,
    onSuccess(response) {
      toastMutationSuccess(
        response?.message ?? __('Pages updated successfully.', 'kirki-ecommerce'),
      );
      void queryClient.invalidateQueries({
        queryKey: settingsKeys.section('advance'),
      });
    },
    onError(error) {
      toastMutationError(error);
    },
  });
};

export { fixPages, getPages, usePageRunFixMutation, usePagesQuery };
