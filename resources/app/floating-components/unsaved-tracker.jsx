import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router";
import { ConfirmationModal } from "@/components/modal/confirmation-modal";
import { setUnsavedDataStatus } from '../pages/settings/utils';

const UnsavedChangesController = () => {
  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedData) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedData]);

  const confirmAction = ({ action, otherProps = {} }) => {
    const { variant = "default", force = false, title, subtitle } = otherProps;

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

      <Outlet context={{ confirmAction }} />
    </>
  );
};

export default UnsavedChangesController;
