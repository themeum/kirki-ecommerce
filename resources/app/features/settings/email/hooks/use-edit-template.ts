import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { buildEmailTemplatePayload, resolveTemplateFormOverrides } from '@/features/settings/email/lib/template';
import { EmailSettingsFormSchema } from '@/features/settings/email/schemas/forms/email-settings-form';
import {
  type EmailTemplateFormInput,
  type EmailTemplateFormPayload,
  EmailTemplateFormSchema,
} from '@/features/settings/email/schemas/forms/email-template-form';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';

type UseEditTemplateResult = {
  form: UseFormReturn<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>;
  loaded: boolean;
  heightValue: number;
};

export const useEditTemplate = (): UseEditTemplateResult => {
  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const loaded = !isLoading && Boolean(emailSettingsData);
  const defaultEmail = emailSettingsData?.default_template as
    | Record<string, unknown>
    | undefined;

  const form = useForm<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>({
    resolver: zodResolver(EmailTemplateFormSchema),
    defaultValues: getDefaults(EmailTemplateFormSchema),
  });

  const heightValue = form.watch('height') ?? 50;
  const { isDirty } = form.formState;

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (!defaultEmail) {
      return;
    }

    form.reset(
      pickFormValues(EmailTemplateFormSchema, defaultEmail, resolveTemplateFormOverrides(defaultEmail)),
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
        data: buildEmailTemplatePayload(emailSettingsData, currentEmailSettings, payload),
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix: 'data.default_template.',
      });
    }
  };

  const handleDiscard = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscard,
  });

  return { form, loaded, heightValue };
};
