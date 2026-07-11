import { useEffect, useState } from 'react';

import AnimatedPage from '@/components/animated-page/animated-page';
import { ConfirmationModal } from '@/components/modal/confirmation-modal';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { useAppSelector } from '@/store/hooks';
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
  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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
        <ConfirmationModal
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

export default UnsavedChangesController;
