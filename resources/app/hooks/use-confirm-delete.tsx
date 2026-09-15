import { useCallback, useState } from 'react';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';

type ConfirmDeleteOptions = {
  title: string;
  description?: string;
  confirmText?: string;
};

type PendingConfirmation = ConfirmDeleteOptions & {
  settle: (confirmed: boolean) => void;
};

/**
 * Gates a delete behind the shared `delete` confirmation dialog.
 *
 * Render `deleteConfirmation` once in the component that owns the delete, then
 * call `confirmDelete` from the delete handler. `confirmDeleteAsync` is the same
 * prompt for callers that need the decision as a value — bulk table actions read
 * it so a cancel can reject `onBulkApply` and leave the row selection intact.
 */
const useConfirmDelete = () => {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const confirmDeleteAsync = useCallback((options: ConfirmDeleteOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, settle: resolve });
    });
  }, []);

  const confirmDelete = useCallback((options: ConfirmDeleteOptions, onConfirm: () => void) => {
    setPending({
      ...options,
      settle: (confirmed) => {
        if (confirmed) {
          onConfirm();
        }
      },
    });
  }, []);

  const settlePending = useCallback(
    (confirmed: boolean) => {
      pending?.settle(confirmed);
      setPending(null);
    },
    [pending],
  );

  const deleteConfirmation = pending ? (
    <ConfirmationDialog
      variant="delete"
      title={pending.title}
      subtitle={pending.description}
      confirmText={pending.confirmText}
      onConfirm={() => settlePending(true)}
      onCancel={() => settlePending(false)}
    />
  ) : null;

  return { confirmDelete, confirmDeleteAsync, deleteConfirmation };
};

export default useConfirmDelete;

export type { ConfirmDeleteOptions };
