import type { ConfirmActionParams } from '@/floating-components/unsaved-tracker';

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
type SettingsOutletContext = {
  confirmAction: (params: ConfirmActionParams) => void;
};

type SettingsLayoutOutletContext = SettingsOutletContext & {
  registerActions: (actions: RegisteredSettingsPageActions | null) => void;
};

export type {
  RegisteredSettingsPageActions,
  SettingsLayoutOutletContext,
  SettingsOutletContext,
  SettingsPageActionsInput,
};
