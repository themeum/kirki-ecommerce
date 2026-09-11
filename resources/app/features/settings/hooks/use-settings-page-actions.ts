import { useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router';

import type {
  SettingsLayoutOutletContext,
  SettingsPageActionsInput,
} from '@/features/settings/types';

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
