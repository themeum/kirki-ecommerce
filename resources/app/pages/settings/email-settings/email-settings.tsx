import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { AtSignIcon, BrushIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Text from '@/molecules/text';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';
import AdminEmail from '@/pages/settings/email-settings/admin-email';
import CustomerEmail from '@/pages/settings/email-settings/customer-email';
import { EMAIL_CONFIG, findEmailKeyByName, buildTogglePayload } from '@/pages/settings/email-settings/utils';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type EmailGroupData = {
  order_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
  user_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
  inventory_notifications?: Record<string, { name?: string; is_enabled?: boolean; [key: string]: unknown }>;
};

type EmailSettingsFormData = SettingsSectionData & {
  admin_emails?: EmailGroupData;
  customer_emails?: EmailGroupData;
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
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(emailSettingsData);
  const [dataObj, setDataObj] = useState<EmailSettingsFormData>({});
  const adminEmails = dataObj?.admin_emails;
  const customerEmails = dataObj?.customer_emails;

  useEffect(() => {
    if (Object.keys(emailSettingsData || {}).length) {
      setDataObj(emailSettingsData as EmailSettingsFormData);
    }
  }, [emailSettingsData]);

  const handleSaveData = () => {
    saveSettings(
      { key: 'email', data: dataObj },
      { onSuccess: () => setUnsavedDataStatus(false) },
    );
  };

  const handleToggleOrder = (item: EmailListItem) => {
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) =>
      item.key.includes(k),
    );

    if (!matchedConfigKey) {
      return;
    }

    const { root, group } = EMAIL_CONFIG[matchedConfigKey];
    const rootData = (
      emailSettingsData as Record<string, EmailGroupData | undefined> | null
    )?.[root];
    const groupData = rootData?.[group as keyof EmailGroupData];
    if (!groupData) {
      return;
    }

    const selectedKey = findEmailKeyByName(groupData, item.name || '');
    if (!selectedKey) {
      return;
    }
    setUnsavedDataStatus(true);
    const payload = buildTogglePayload({
      baseData: dataObj,
      rootKey: root,
      groupKey: group,
      selectedKey,
    });

    if (payload) {
      setDataObj(payload as EmailSettingsFormData);
    }
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: emailSettingsData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
      },
    });
  };

  const handleDiscardData = () => {
    setDataObj((emailSettingsData as EmailSettingsFormData) || {});
    setUnsavedDataStatus(false);
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
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                onClick={handleDiscardData}
                size="small"
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                onClick={handleSaveData}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              textIcon={<AtSignIcon />}
              text={__('Email', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />
            <Card style={{ borderRadius: '8px' }}>
              <Flex
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Flex
                  direction="column"
                  style={{ alignItems: 'flex-start' }}
                  gap={6}
                >
                  <Text
                    header={__('Default Template', 'kirki-ecommerce')}
                    type="primary"
                    style={{ gap: '6px' }}
                    leftIcon={<BrushIcon />}
                  />
                  <Text
                    subHeader={__(
                      'Configure logo, colors, sender email, and more for emails',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
                <Button
                  text={__('Edit', 'kirki-ecommerce')}
                  type="secondary"
                  onClick={() => {
                    navigate('/settings/email/edit-template');
                  }}
                />
              </Flex>
            </Card>
            <CustomerEmail
              customerEmails={customerEmails}
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
            <AdminEmail
              adminEmails={adminEmails}
              handleToggleOrder={handleToggleOrder}
              handleEditOrder={handleEditOrder}
            />
          </Flex>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

EmailSettings.displayName = 'EmailSettings';

export default EmailSettings;
