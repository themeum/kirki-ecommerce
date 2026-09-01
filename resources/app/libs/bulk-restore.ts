import type { ListParams } from '@/types/list-state';

type BulkRestorePayload<TFilter extends Record<string, unknown> = Record<string, unknown>> = {
  action: 'restore' | 'restore-all';
  ids: number[] | null;
  params?: ListParams<TFilter>;
};

/**
 * Every list/table page's bulk-restore branches the same way: "select all"
 * (potentially spanning pages the client never fetched) is a distinct
 * server action from deleting a known set of ids.
 */
export const resolveBulkRestorePayload = <TFilter extends Record<string, unknown> = Record<string, unknown>>(
  isSelectAll: boolean,
  selectedItems: (string | number)[],
  params?: ListParams<TFilter>,
): BulkRestorePayload<TFilter> =>
  isSelectAll
    ? { action: 'restore-all', ids: null, params }
    : { action: 'restore', ids: selectedItems as number[], params };
