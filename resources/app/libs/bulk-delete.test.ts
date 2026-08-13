import { describe, expect, it } from 'vitest';

import { resolveBulkDeletePayload } from '@/libs/bulk-delete';

describe('resolveBulkDeletePayload', () => {
  it('resolves a select-all bulk delete to the delete-all action with no ids', () => {
    expect(resolveBulkDeletePayload(true, [1, 2, 3])).toEqual({ action: 'delete-all', ids: null });
  });

  it('resolves a specific selection to the delete action with those ids', () => {
    expect(resolveBulkDeletePayload(false, [1, 2, 3])).toEqual({ action: 'delete', ids: [1, 2, 3] });
  });

  it('resolves an empty selection to a delete action with an empty ids array', () => {
    expect(resolveBulkDeletePayload(false, [])).toEqual({ action: 'delete', ids: [] });
  });
});
