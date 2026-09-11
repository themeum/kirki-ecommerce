import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';

import { setUnsavedDataStatus } from '@/libs/unsaved-store';

type UnsavedNavigationGuard = {
  isBlocked: boolean;
  proceedNavigation: () => void;
  cancelNavigation: () => void;
  markSaving: (saving: boolean) => void;
  shakeSignal: number;
};

export const useUnsavedNavigationGuard = (
  isDirty: boolean,
): UnsavedNavigationGuard => {
  const isSavingRef = useRef(false);
  const [shakeSignal, setShakeSignal] = useState(0);

  // The single owner of the application-wide unsaved flag that the root
  // controller's `beforeunload` reads. Clearing it on unmount is what stops an
  // abandoned dirty screen from leaving the flag set for every later page.
  useEffect(() => {
    setUnsavedDataStatus(isDirty);
    return () => setUnsavedDataStatus(false);
  }, [isDirty]);

  // A ref (not state) so a save-triggered navigation started synchronously
  // inside onSubmit is never blocked, regardless of React's render/effect
  // timing relative to that navigation.
  const shouldBlock = useCallback(
    () => isDirty && !isSavingRef.current,
    [isDirty],
  );

  const blocker = useBlocker(shouldBlock);
  const isBlocked = blocker.state === 'blocked';

  // Every blocked navigation attempt (the first one, and any repeat attempt
  // while the bar is already visible) produces a fresh blocker object, even
  // though `isBlocked` itself stays `true` across repeats. Bump a signal on
  // each one so the bar can replay its shake animation as a nudge.
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShakeSignal((value) => value + 1);
    }
  }, [blocker]);

  // Data was saved (or reset) while a navigation was paused; let go of it
  // instead of leaving the blocker stuck in the 'blocked' state forever.
  useEffect(() => {
    if (isBlocked && !isDirty) {
      blocker.reset();
    }
  }, [isBlocked, isDirty, blocker]);

  const proceedNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const cancelNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const markSaving = (saving: boolean) => {
    isSavingRef.current = saving;
  };

  return {
    isBlocked,
    proceedNavigation,
    cancelNavigation,
    markSaving,
    shakeSignal,
  };
};
