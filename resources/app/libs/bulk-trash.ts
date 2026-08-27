import type { ListParams } from '@/types/list-state';

type BulkTrashPayload<TFilter extends Record<string, unknown> = Record<string, unknown>> = {
  action: 'trash' | 'trash-all';
  ids: number[] | null;
  params?: ListParams<TFilter>;
};

/**
 * Every list/table page's bulk-trash branches the same way: "select all"
 * (potentially spanning pages the client never fetched) is a distinct
 * server action from deleting a known set of ids.
 */
export const resolveBulkTrashPayload = <TFilter extends Record<string, unknown> = Record<string, unknown>>(
  isSelectAll: boolean,
  selectedItems: (string | number)[],
  params?: ListParams<TFilter>,
): BulkTrashPayload<TFilter> =>
  isSelectAll
    ? { action: 'trash-all', ids: null, params }
    : { action: 'trash', ids: selectedItems as number[], params };
