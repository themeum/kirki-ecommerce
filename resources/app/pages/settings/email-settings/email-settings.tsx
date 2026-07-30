import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { AtSignIcon, BrushIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import { EmailSettingsFormSchema, emailSettingsDefaultValues, type EmailSettingsFormValues } from '@/schemas/forms/email-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import AdminEmail from '@/pages/settings/email-settings/admin-email';
import CustomerEmail from '@/pages/settings/email-settings/customer-email';
import { EMAIL_CONFIG, findEmailKeyByName, buildTogglePayload } from '@/pages/settings/email-settings/utils';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type EmailGroupData = {
  order_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean; [key: string]: unknown }
  >;
  user_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean; [key: string]: unknown }
  >;
  inventory_notifications?: Record<
    string,
    { name?: string; is_enabled?: boolean; [key: string]: unknown }
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
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const hasUnsavedData = useUnsavedStatus();

  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(emailSettingsData);

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(EmailSettingsFormSchema),
    defaultValues: emailSettingsDefaultValues,
  });

  useEffect(() => {
    if (!emailSettingsData || !Object.keys(emailSettingsData).length) {
      return;
    }
    form.reset(emailSettingsData as EmailSettingsFormValues);
  }, [emailSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(form.formState.isDirty);
  }, [form.formState.isDirty]);

  const handleSaveData = async (values: EmailSettingsFormValues) => {
    try {
      await saveSettings({
        key: 'email',
        data: values as SettingsSectionData,
      });
      form.reset(values);
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
      baseData: currentValues as SettingsSectionData,
      rootKey: root,
      groupKey: group,
      selectedKey,
    });

    if (!payload) {
      return;
    }

    form.setValue(
      root as 'admin_emails' | 'customer_emails',
      (payload as EmailSettingsFormValues)[
        root as 'admin_emails' | 'customer_emails'
      ],
      { shouldDirty: true },
    );
  };

  const handleBackButton = () => {
    if (form.formState.isDirty) {
      confirmAction({
        action: () => navigate('/settings'),
      });
      return;
    }
    navigate('/settings');
  };

  const handleDiscardData = () => {
    form.reset();
  };

  return (
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                variant="ghost"
                onClick={handleDiscardData}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSaveData)}
                loading={isPending}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <PageNavbar
                textIcon={<AtSignIcon />}
                text={__('Email', 'kirki-ecommerce')}
                handleBack={handleBackButton}
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
                navigate('/settings/email/edit-template');
                }}
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
    </>
  );
};

EmailSettings.displayName = 'EmailSettings';

export default EmailSettings;

const styles = defineStyles({
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
});
