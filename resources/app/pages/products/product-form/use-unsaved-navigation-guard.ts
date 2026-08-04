import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router';

type UnsavedNavigationGuard = {
  isBlocked: boolean;
  discardChanges: () => void;
  dismissToast: () => void;
  markSaving: (saving: boolean) => void;
  shakeSignal: number;
};

export const useUnsavedNavigationGuard = (
  isDirty: boolean,
): UnsavedNavigationGuard => {
  const isSavingRef = useRef(false);
  const [shakeSignal, setShakeSignal] = useState(0);

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
  // while the toast is already open) produces a fresh blocker object, even
  // though `isBlocked` itself stays `true` across repeats. Bump a signal on
  // each one so the toast can replay its shake animation as a nudge.
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

  return { isBlocked, discardChanges, dismissToast, markSaving, shakeSignal };
};
