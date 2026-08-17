type BulkDeletePayload = {
  action: 'delete' | 'delete-all';
  ids: number[] | null;
};

/**
 * Every list/table page's bulk-delete branches the same way: "select all"
 * (potentially spanning pages the client never fetched) is a distinct
 * server action from deleting a known set of ids.
 */
export const resolveBulkDeletePayload = (
  isSelectAll: boolean,
  selectedItems: (string | number)[],
): BulkDeletePayload =>
  isSelectAll
    ? { action: 'delete-all', ids: null }
    : { action: 'delete', ids: selectedItems as number[] };
