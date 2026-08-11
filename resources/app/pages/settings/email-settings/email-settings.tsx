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
import { AtSignIcon, BrushIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import AdminEmail from '@/pages/settings/email-settings/admin-email';
import CustomerEmail from '@/pages/settings/email-settings/customer-email';
import { buildTogglePayload, EMAIL_CONFIG, findEmailKeyByName } from '@/pages/settings/email-settings/utils';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import {
  type EmailSettingsFormInput,
  type EmailSettingsFormPayload,
  EmailSettingsFormSchema,
} from '@/schemas/forms/email-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type EmailGroupData = {
  order_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean;[key: string]: unknown }
  >;
  user_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean;[key: string]: unknown }
  >;
  inventory_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean;[key: string]: unknown }
  >;
};

type EmailListItem = {
  key: string;
  name?: string;
  is_enabled?: boolean;
  [key: string]: unknown;
};

const handleEditOrder = (item: EmailListItem) => console.log('Edit:', item);

const EmailSettings = () => {
  const navigate = useNavigate();

  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const loaded = !isLoading && Boolean(emailSettingsData);

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

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

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
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) =>
      item.key.includes(k),
    );

    if (!matchedConfigKey) {
      return;
    }

    const { root, group } = EMAIL_CONFIG[matchedConfigKey];
    const currentValues = form.getValues();
    const rootData = (
      currentValues as Record<string, EmailGroupData | undefined>
    )?.[root];
    const groupData = rootData?.[group as keyof EmailGroupData];

    if (!groupData) {
      return;
    }

    const selectedKey = findEmailKeyByName(groupData, item.name || '');
    if (!selectedKey) {
      return;
    }

    const payload = buildTogglePayload({
      baseData: currentValues,
      rootKey: root,
      groupKey: group,
      selectedKey,
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

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty: form.formState.isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<AtSignIcon />}
              title={__('Email', 'kirki-ecommerce')}
            />
            <Card cssOverride={styles.roundedCard}>
              <CardContent>

                <Flex
                  justify="space-between" align="center">
                  <Flex
                    direction="column"
                    gap={2}
                    align="flex-start">
                    <Flex gap={2} align="center">
                      <BrushIcon />
                      <Text weight="semibold">{__('Default Template', 'kirki-ecommerce')}</Text>
                    </Flex>
                    <Text color="secondary">{__(
                      'Configure logo, colors, sender email, and more for emails',
                      'kirki-ecommerce',
                    )}</Text>
                  </Flex>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void navigate(
                        RouteConfig.Settings.get('EmailSettings').get('EditEmailTemplate').buildLink(),
                      );
                    }}
                    disabled // @todo: will be implemented in the future
                  >
                    {__('Edit', 'kirki-ecommerce')}
                  </Button>
                </Flex>
              </CardContent>
            </Card>
            <CustomerEmail
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
            <AdminEmail
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
          </Flex>
        </Form>
      ) : (
        <div>{__('Loading ...', 'kirki-ecommerce')}</div>
      )}
    </Container>
  );
};

EmailSettings.displayName = 'EmailSettings';

export default EmailSettings;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
});
