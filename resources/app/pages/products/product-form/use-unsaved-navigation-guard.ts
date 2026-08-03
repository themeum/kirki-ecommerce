import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router';

type UnsavedNavigationGuard = {
  isBlocked: boolean;
  dismissToast: () => void;
};

export const useUnsavedNavigationGuard = (
  isDirty: boolean,
): UnsavedNavigationGuard => {
  const [isBlocked, setIsBlocked] = useState(false);
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setIsBlocked(true);
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!isDirty) {
      setIsBlocked(false);
    }
  }, [isDirty]);

  const dismissToast = () => {
    setIsBlocked(false);
  };

  return { isBlocked, dismissToast };
};
