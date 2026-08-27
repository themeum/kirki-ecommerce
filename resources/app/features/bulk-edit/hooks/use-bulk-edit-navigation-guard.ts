import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';

type BulkEditNavigationGuard = {
  isBlocked: boolean;
  discardChanges: () => void;
  dismissToast: () => void;
  markSaving: (saving: boolean) => void;
};

/**
 * Blocks in-app navigation while the grid has unsaved edits. A save-triggered
 * navigation started synchronously inside the save handler must never be
 * blocked, so "currently saving" is tracked in a ref rather than state —
 * state wouldn't be visible to `shouldBlock` before the navigation call runs.
 */
export const useBulkEditNavigationGuard = (isDirty: boolean): BulkEditNavigationGuard => {
  const isSavingRef = useRef(false);

  const shouldBlock = useCallback(() => isDirty && !isSavingRef.current, [isDirty]);

  const blocker = useBlocker(shouldBlock);
  const isBlocked = blocker.state === 'blocked';

  useEffect(() => {
    if (isBlocked && !isDirty) {
      blocker.reset();
    }
  }, [isBlocked, isDirty, blocker]);

  const discardChanges = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const dismissToast = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const markSaving = (saving: boolean) => {
    isSavingRef.current = saving;
  };

  return { isBlocked, discardChanges, dismissToast, markSaving };
};
