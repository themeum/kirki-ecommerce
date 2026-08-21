import { useQueryClient } from '@tanstack/react-query';

import { settingsKeys } from '@/libs/query-keys';

/**
 * Both region pages call `updateSettings` directly (not the mutation hook)
 * on their "delete" path, so they invalidate the `tax` settings query
 * themselves afterward. Shared here since it's the same call in both places.
 */
export const useInvalidateTaxSettings = (): (() => void) => {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: settingsKeys.section('tax') });
  };
};
