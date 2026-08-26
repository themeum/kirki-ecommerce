import type { ListParams } from '@/types/list-state';

type BulkDeletePayload<TFilter extends Record<string, unknown> = Record<string, unknown>> = {
  action: 'delete' | 'delete-all';
  ids: number[] | null;
  params?: ListParams<TFilter>;
};

/**
 * Every list/table page's bulk-delete branches the same way: "select all"
 * (potentially spanning pages the client never fetched) is a distinct
 * server action from deleting a known set of ids.
 */
export const resolveBulkDeletePayload = <TFilter extends Record<string, unknown> = Record<string, unknown>>(
  isSelectAll: boolean,
  selectedItems: (string | number)[],
  params?: ListParams<TFilter>,
): BulkDeletePayload<TFilter> =>
  isSelectAll
    ? { action: 'delete-all', ids: null, params }
    : { action: 'delete', ids: selectedItems as number[], params };
