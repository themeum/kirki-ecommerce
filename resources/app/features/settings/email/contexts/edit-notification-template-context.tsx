import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, type ReactNode, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';

import {
  buildNotificationTemplatePayload,
  notificationGroupKey,
  notificationRootKey,
} from '@/features/settings/email/lib/template';
import type { NotificationTemplateRef } from '@/features/settings/email/lib/utils';
import { getNotificationTemplateLabel } from '@/features/settings/email/lib/utils';
import type {
  EmailNotificationTemplateFormInput,
  EmailNotificationTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-notification-template-form';
import { EmailNotificationTemplateFormSchema } from '@/features/settings/email/schemas/forms/email-notification-template-form';
import { EmailSettingsFormSchema } from '@/features/settings/email/schemas/forms/email-settings-form';
import { useUnsavedNavigationGuard } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';

export type EditNotificationTemplateContextValue = {
  form: UseFormReturn<
    EmailNotificationTemplateFormInput,
    unknown,
    EmailNotificationTemplateFormPayload
  >;
  ref: NotificationTemplateRef;
  label: string;
  loaded: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isBlocked: boolean;
  shakeSignal: number;
  onSave: () => Promise<void>;
  onDiscard: () => void;
};

const EditNotificationTemplateContext = createContext<EditNotificationTemplateContextValue | null>(
  null,
);

type EditNotificationTemplateProviderProps = {
  children: ReactNode;
};

const EditNotificationTemplateProvider = ({ children }: EditNotificationTemplateProviderProps) => {
  const params = useParams<{ type: string; group: string; key: string }>();
  const ref: NotificationTemplateRef = {
    type: params.type as NotificationTemplateRef['type'],
    group: params.group as NotificationTemplateRef['group'],
    key: params.key ?? '',
  };

  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const rootKey = notificationRootKey(ref.type);
  const groupKey = notificationGroupKey(ref.group);
  const currentNotification = (
    emailSettingsData?.[rootKey] as Record<string, Record<string, unknown>> | undefined
  )?.[groupKey]?.[ref.key] as Record<string, unknown> | undefined;

  const form = useForm<
    EmailNotificationTemplateFormInput,
    unknown,
    EmailNotificationTemplateFormPayload
  >({
    resolver: zodResolver(EmailNotificationTemplateFormSchema),
    defaultValues: getDefaults(EmailNotificationTemplateFormSchema),
  });

  const { isDirty } = form.formState;
  const { isBlocked, cancelNavigation, markSaving, shakeSignal } =
    useUnsavedNavigationGuard(isDirty);

  useEffect(() => {
    if (!currentNotification) {
      return;
    }

    form.reset(pickFormValues(EmailNotificationTemplateFormSchema, currentNotification));
  }, [currentNotification, form]);

  const handleSaveData = async (payload: EmailNotificationTemplateFormPayload) => {
    if (!emailSettingsData) {
      return;
    }

    try {
      const currentEmailSettings = EmailSettingsFormSchema.parse(
        pickFormValues(EmailSettingsFormSchema, emailSettingsData),
      );

      await saveSettings({
        key: 'email',
        data: buildNotificationTemplatePayload(currentEmailSettings, ref, payload),
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix: `data.${rootKey}.${groupKey}.${ref.key}.`,
      });
    }
  };

  const handleSave = async () => {
    markSaving(true);

    try {
      await form.handleSubmit(handleSaveData)();
    } finally {
      markSaving(false);
    }
  };

  const handleDiscard = () => {
    form.reset();
    cancelNavigation();
  };

  const value = {
    form,
    ref,
    label: getNotificationTemplateLabel(ref),
    loaded: !isLoading,
    isDirty,
    isSaving: isPending,
    isBlocked,
    shakeSignal,
    onSave: handleSave,
    onDiscard: handleDiscard,
  };

  return (
    <EditNotificationTemplateContext.Provider value={value}>
      {children}
    </EditNotificationTemplateContext.Provider>
  );
};

EditNotificationTemplateProvider.displayName = 'EditNotificationTemplateProvider';

export { EditNotificationTemplateContext, EditNotificationTemplateProvider };
