import { useEffect, useState } from 'react';

import AnimatedPage from '@/components/animated-page/animated-page';
import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import { setUnsavedDataStatus, useUnsavedStatus } from '@/libs/unsaved-store';
import type { ConfirmationVariant } from '@/types';

type ConfirmActionOtherProps = {
  variant?: ConfirmationVariant;
  force?: boolean;
  title?: string;
  subtitle?: string;
};

type ConfirmActionParams = {
  action?: () => void;
  otherProps?: ConfirmActionOtherProps;
};

type PendingAction = {
  action?: () => void;
  otherProps: {
    variant: ConfirmationVariant;
    title?: string;
    subtitle?: string;
  };
};

const UnsavedChangesController = () => {
  const hasUnsavedData = useUnsavedStatus();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedData) {
        return;
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedData]);

  const confirmAction = ({ action, otherProps = {} }: ConfirmActionParams) => {
    const { variant = 'default', force = false, title, subtitle } = otherProps;

    if (!force && !hasUnsavedData) {
      action?.();
      return;
    }

    setPendingAction({
      action,
      otherProps: {
        variant,
        title,
        subtitle,
      },
    });
  };

  const handleConfirm = () => {
    setUnsavedDataStatus(false);
    pendingAction?.action?.();
    setPendingAction(null);
  };

  const handleCancel = () => {
    setPendingAction(null);
  };

  return (
    <>
      {pendingAction && (
        <ConfirmationDialog
          variant={pendingAction.otherProps.variant}
          title={pendingAction.otherProps.title}
          subtitle={pendingAction.otherProps.subtitle}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      <AnimatedPage context={{ confirmAction }} />
    </>
  );
};

UnsavedChangesController.displayName = 'UnsavedChangesController';

export default UnsavedChangesController;
