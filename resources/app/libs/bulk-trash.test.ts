import { describe, expect, it } from 'vitest';

import { resolveBulkTrashPayload } from '@/libs/bulk-trash';

describe('resolveBulkTrashPayload', () => {
  it('resolves a select-all bulk trash to the trash-all action with no ids', () => {
    expect(resolveBulkTrashPayload(true, [1, 2, 3], { status: 'draft' })).toEqual({ action: 'trash-all', ids: null, params: { status: 'draft' } });
  });

  it('resolves a specific selection to the trash action with those ids', () => {
    expect(resolveBulkTrashPayload(false, [1, 2, 3], { status: 'draft' })).toEqual({ action: 'trash', ids: [1, 2, 3], params: { status: 'draft' } });
  });

  it('resolves an empty selection to a trash action with an empty ids array', () => {
    expect(resolveBulkTrashPayload(false, [])).toEqual({ action: 'trash', ids: [], params: undefined });
  });
});
