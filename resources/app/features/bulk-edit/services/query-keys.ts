import type { ListQueryParams } from '@/types/list-state';

const bulkEditKeys = {
  all: ['BulkVariants'] as const,
  list: (ids: (string | number)[], params?: ListQueryParams) => [...bulkEditKeys.all, ids, params] as const,
};

export { bulkEditKeys };
