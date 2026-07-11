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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import type { SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '../utils';
import AdminEmail from './admin-email';
import CustomerEmail from './customer-email';
import { EMAIL_CONFIG, findEmailKeyByName, buildTogglePayload } from './utils';

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
  const dispatch = useAppDispatch();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: emailSettingsData } = useAppSelector(
    (state) => state.settings?.email,
  );
  const [dataObj, setDataObj] = useState<EmailSettingsFormData>({});
  const adminEmails = dataObj?.admin_emails;
  const customerEmails = dataObj?.customer_emails;

  useEffect(() => {
    if (Object.keys(emailSettingsData || {}).length) {
      setDataObj(emailSettingsData as EmailSettingsFormData);
    }
  }, [emailSettingsData]);

  useEffect(() => {
    if (!loaded) {
      dispatch(getSettingsAPI('email', {}));
    }
  }, []);

  const handleSaveData = async () => {
    const result = await updateSettingsAPI('email', dataObj);
    if (isApiSuccess(result)) {
      setUnsavedDataStatus(false);
      dispatch(
        updateSettings({
          key: 'email',
          value: result.data as SettingsSectionData,
        }),
      );
    }
  };

  const handleToggleOrder = async (item: EmailListItem) => {
    const matchedConfigKey = Object.keys(EMAIL_CONFIG).find((k) =>
      item.key.includes(k),
    );

    if (!matchedConfigKey) {
      return;
    }

    const { root, group } = EMAIL_CONFIG[matchedConfigKey];
    const rootData = emailSettingsData?.[root] as EmailGroupData | undefined;
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

export default EmailSettings;
