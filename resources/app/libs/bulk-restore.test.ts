import { describe, expect, it } from 'vitest';

import { resolveBulkRestorePayload } from '@/libs/bulk-restore';

describe('resolveBulkRestorePayload', () => {
  it('resolves a select-all bulk restore to the restore-all action with no ids', () => {
    expect(resolveBulkRestorePayload(true, [1, 2, 3], { status: 'trash' })).toEqual({ action: 'restore-all', ids: null, params: { status: 'trash' } });
  });

  it('resolves a specific selection to the restore action with those ids', () => {
    expect(resolveBulkRestorePayload(false, [1, 2, 3], { status: 'trash' })).toEqual({ action: 'restore', ids: [1, 2, 3], params: { status: 'trash' } });
  });

  it('resolves an empty selection to a restore action with an empty ids array', () => {
    expect(resolveBulkRestorePayload(false, [])).toEqual({ action: 'restore', ids: [], params: undefined });
  });
});
