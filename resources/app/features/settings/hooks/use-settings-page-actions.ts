import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router';

type SettingsPageActionsInput = {
  isDirty: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

type RegisteredSettingsPageActions = {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

type SettingsLayoutOutletContext = {
  registerActions: (actions: RegisteredSettingsPageActions | null) => void;
};

const useSettingsPageActions = (actions: SettingsPageActionsInput): void => {
  const { registerActions } = useOutletContext<SettingsLayoutOutletContext>();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    registerActions({
      isDirty: actionsRef.current.isDirty,
      isSaving: actionsRef.current.isSaving ?? false,
      onSave: () => actionsRef.current.onSave(),
      onDiscard: () => actionsRef.current.onDiscard(),
    });

    return () => registerActions(null);
  }, [actions.isDirty, actions.isSaving, registerActions]);
};

export { useSettingsPageActions };
export type { RegisteredSettingsPageActions };
