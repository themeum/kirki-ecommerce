import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import AdminEmail from '@/features/settings/email/components/admin-email';
import CustomerEmail from '@/features/settings/email/components/customer-email';
import MailConfiguration from '@/features/settings/email/components/mail-configuration/mail-configuration';
import {
  buildTogglePayload,
  EMAIL_CONFIG,
  type EmailListItem,
  resolveNotificationTemplate,
} from '@/features/settings/email/lib/utils';
import {
  type EmailSettingsFormInput,
  type EmailSettingsFormPayload,
  EmailSettingsFormSchema,
} from '@/features/settings/email/schemas/forms/email-settings-form';
import EmailSettingsSkeleton from '@/features/settings/email/skeletons/email-settings-skeleton';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { AtSignIcon, BrushIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const EmailSettings = () => {
  const navigate = useNavigate();

  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const form = useForm<EmailSettingsFormInput, unknown, EmailSettingsFormPayload>({
    resolver: zodResolver(EmailSettingsFormSchema),
    defaultValues: getDefaults(EmailSettingsFormSchema),
  });

  useEffect(() => {
    if (!emailSettingsData || !Object.keys(emailSettingsData).length) {
      return;
    }
    form.reset(pickFormValues(EmailSettingsFormSchema, emailSettingsData));
  }, [emailSettingsData, form]);

  const handleSaveData = async (payload: EmailSettingsFormPayload) => {
    try {
      await saveSettings({
        key: 'email',
        data: payload,
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleToggleOrder = (item: EmailListItem) => {
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) => item.key.includes(k));

    if (!matchedConfigKey) {
      return;
    }

    const template = resolveNotificationTemplate(item, matchedConfigKey);

    if (!template) {
      return;
    }

    const { root, group } = EMAIL_CONFIG[matchedConfigKey];
    const currentValues = form.getValues();

    const payload = buildTogglePayload({
      baseData: currentValues,
      rootKey: root,
      groupKey: group,
      selectedKey: template.key,
    });

    if (!payload) {
      return;
    }

    form.setValue(
      root as 'admin_emails' | 'customer_emails',
      payload[root as 'admin_emails' | 'customer_emails'],
      { shouldDirty: true },
    );
  };

  const handleEditOrder = (item: EmailListItem) => {
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) => item.key.includes(k));

    if (!matchedConfigKey) {
      return;
    }

    const template = resolveNotificationTemplate(item, matchedConfigKey);

    if (!template) {
      return;
    }

    void navigate(
      RouteConfig.Settings.get('EmailSettings').get('EditNotificationTemplate').buildLink(template),
    );
  };

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty: form.formState.isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return !isLoading ? (
    <Container size="sm">
      <Form {...form}>
        <Flex direction="column" gap={4}>
          <SettingsPageHeader icon={<AtSignIcon />} title={__('Email', 'kirki-ecommerce')} />
          <Card
            data-search-id="email.default-template"
            data-search-keywords="branding, header, footer, from name, sender address"
            cssOverride={styles.roundedCard}
          >
            <CardContent>
              <Flex justify="space-between" align="center">
                <Flex direction="column" gap={2} align="flex-start">
                  <Flex gap={2} align="center">
                    <BrushIcon />
                    <Text weight="semibold">{__('Default Template', 'kirki-ecommerce')}</Text>
                  </Flex>
                  <Text color="secondary">
                    {__(
                      'Logo, colors, sender name and footer shared by every outgoing email.',
                      'kirki-ecommerce',
                    )}
                  </Text>
                </Flex>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void navigate(
                      RouteConfig.Settings.get('EmailSettings')
                        .get('EditEmailTemplate')
                        .buildLink(),
                    );
                  }}
                >
                  {__('Edit', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </CardContent>
          </Card>
          <MailConfiguration />
          <CustomerEmail handleToggleOrder={handleToggleOrder} handleEditOrder={handleEditOrder} />
          <AdminEmail handleToggleOrder={handleToggleOrder} handleEditOrder={handleEditOrder} />
        </Flex>
      </Form>
    </Container>
  ) : (
    <EmailSettingsSkeleton />
  );
};

EmailSettings.displayName = 'EmailSettings';

export default EmailSettings;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
});
