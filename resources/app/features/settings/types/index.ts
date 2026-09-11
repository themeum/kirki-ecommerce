import type { ConfirmActionParams } from '@/floating-components/unsaved-tracker';

type SettingsPageActionsInput = {
  isDirty: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

type SettingsOutletContext = {
  confirmAction: (params: ConfirmActionParams) => void;
};

type SettingsLayoutOutletContext = SettingsOutletContext & {
  registerActions: (actions: SettingsPageActionsInput | null) => void;
};

export type { SettingsLayoutOutletContext, SettingsOutletContext, SettingsPageActionsInput };
