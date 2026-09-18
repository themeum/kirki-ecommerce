import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, type ReactNode, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import {
  buildEmailTemplatePayload,
  resolveTemplateFormOverrides,
} from '@/features/settings/email/lib/template';
import { EmailSettingsFormSchema } from '@/features/settings/email/schemas/forms/email-settings-form';
import type {
  EmailTemplateFormInput,
  EmailTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-template-form';
import { EmailTemplateFormSchema } from '@/features/settings/email/schemas/forms/email-template-form';
import { useUnsavedNavigationGuard } from '@/hooks';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';

export type EditTemplateContextValue = {
  form: UseFormReturn<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>;
  loaded: boolean;
  heightValue: number;
  isDirty: boolean;
  isSaving: boolean;
  isBlocked: boolean;
  shakeSignal: number;
  onSave: () => Promise<void>;
  onDiscard: () => void;
};

const EditTemplateContext = createContext<EditTemplateContextValue | null>(null);

type EditTemplateProviderProps = {
  children: ReactNode;
};

const EditTemplateProvider = ({ children }: EditTemplateProviderProps) => {
  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const defaultEmail = emailSettingsData?.default_template as Record<string, unknown> | undefined;

  const form = useForm<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>({
    resolver: zodResolver(EmailTemplateFormSchema),
    defaultValues: getDefaults(EmailTemplateFormSchema),
  });

  const heightValue = form.watch('height') ?? 50;
  const { isDirty } = form.formState;
  const { isBlocked, cancelNavigation, markSaving, shakeSignal } =
    useUnsavedNavigationGuard(isDirty);

  useEffect(() => {
    if (!defaultEmail) {
      return;
    }

    form.reset(
      pickFormValues(
        EmailTemplateFormSchema,
        defaultEmail,
        resolveTemplateFormOverrides(defaultEmail),
      ),
    );
  }, [defaultEmail, form]);

  const handleSaveData = async (payload: EmailTemplateFormPayload) => {
    if (!emailSettingsData) {
      return;
    }

    try {
      const currentEmailSettings = EmailSettingsFormSchema.parse(
        pickFormValues(EmailSettingsFormSchema, emailSettingsData),
      );

      await saveSettings({
        key: 'email',
        // EmailSettingsFormPayload['default_template'] mirrors the GET response's
        // hydrated media object for `logo`, but a save always sends the
        // just-edited numeric media id (see SettingsUpdateRequest.php's
        // `data.default_template.logo => nullable|integer` rule) — this cast
        // bridges that read/write shape gap.
        data: buildEmailTemplatePayload(emailSettingsData, currentEmailSettings, payload),
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix: 'data.default_template.',
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
    loaded: !isLoading,
    heightValue,
    isDirty,
    isSaving: isPending,
    isBlocked,
    shakeSignal,
    onSave: handleSave,
    onDiscard: handleDiscard,
  };

  return <EditTemplateContext.Provider value={value}>{children}</EditTemplateContext.Provider>;
};

EditTemplateProvider.displayName = 'EditTemplateProvider';

export { EditTemplateContext, EditTemplateProvider };
