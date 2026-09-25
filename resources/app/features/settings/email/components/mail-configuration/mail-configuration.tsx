import { Edit3Icon, LucideCircleCheckBig, Mail, WrenchIcon } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  type EmailSettingsFormInput,
  EmailSettingsFormSchema,
} from '@/features/settings/email/schemas/forms/email-settings-form';
import type { MailConfigurationFormPayload } from '@/features/settings/email/schemas/forms/mail-configuration-form';
import { useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

import MailConfigurationDialog, {
  ENCRYPTION_OPTIONS,
  MAILER_OPTIONS,
} from './mail-configuration-dialog';

const MailConfiguration = () => {
  const { control, getValues, reset } = useFormContext<EmailSettingsFormInput>();
  const mailConfiguration = useWatch({
    control,
    name: 'mail_configuration',
  });

  const { mutateAsync: saveSettings } = useUpdateSettingsMutation<'email'>();

  const [openPopup, setOpenPopup] = useState(false);

  const handleSaveMailConfiguration = async (values: MailConfigurationFormPayload) => {
    const nextValues = { ...getValues(), mail_configuration: values };

    await saveSettings({
      key: 'email',
      data: EmailSettingsFormSchema.parse(nextValues),
    });

    reset(nextValues);
  };

  const isConfigured = Boolean(mailConfiguration?.mailer);
  const isPhpMailer = mailConfiguration?.mailer === 'php_mail';
  const mailerLabel =
    MAILER_OPTIONS.find((option) => option.value === mailConfiguration?.mailer)?.label ?? '—';
  const encryptionLabel =
    ENCRYPTION_OPTIONS.find((option) => option.value === mailConfiguration?.encryption)?.label ??
    '—';
  const hostLabel = mailConfiguration?.host || '—';
  const portLabel = isDefined(mailConfiguration?.port) ? String(mailConfiguration?.port) : '—';
  const usernameLabel = mailConfiguration?.username || '—';
  const passwordLabel = mailConfiguration?.password ? '********' : '—';
  const fromEmailLabel = mailConfiguration?.from_email || '—';
  const fromNameLabel = mailConfiguration?.from_name || '—';

  return (
    <Card cssOverride={cardStyles.innerCard}>
      <CardContent cssOverride={cardStyles.innerCardContent}>
        <Flex direction="column" gap={4}>
          <Flex justify="space-between" align="center">
            <Flex direction="column" gap={1}>
              <Flex gap={2} align="center">
                <Flex gap={2} align="center">
                  <Mail size={16} />
                  <Text variant="heading6">
                    {__('Mail server Configuration', 'kirki-ecommerce')}
                  </Text>
                </Flex>
                {isConfigured && (
                  <Badge variant="success">
                    <span data-icon="inline-start" aria-hidden="true">
                      <LucideCircleCheckBig size={16} />
                    </span>
                    {__('Completed', 'kirki-ecommerce')}
                  </Badge>
                )}
              </Flex>
              <Text variant="small" color="secondary">
                {__('Configure your email server settings here.', 'kirki-ecommerce')}
              </Text>
            </Flex>
            {isConfigured ? (
              <Button variant="secondary" size="icon-sm" onClick={() => setOpenPopup(true)}>
                <Edit3Icon size={16} />
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setOpenPopup(true)}>
                <WrenchIcon />
                {__('Configure', 'kirki-ecommerce')}
              </Button>
            )}
          </Flex>
          {isConfigured && (
            <Card cssOverride={mergeCss(cardStyles.innerDarkCard, { boxShadow: 'none' })}>
              <CardContent cssOverride={cardStyles.innerCardContent}>
                <Flex direction="column" gap={2}>
                  <Flex gap={1} align="center">
                    <Text variant="small" color="subdued">
                      {__('From Email:', 'kirki-ecommerce')}
                    </Text>
                    <Text variant="small">{fromEmailLabel}</Text>
                  </Flex>
                  <Flex gap={1} align="center">
                    <Text variant="small" color="subdued">
                      {__('From Name:', 'kirki-ecommerce')}
                    </Text>
                    <Text variant="small">{fromNameLabel}</Text>
                  </Flex>

                  <Flex gap={1} align="center">
                    <Text variant="small" color="subdued">
                      {__('Mailer:', 'kirki-ecommerce')}
                    </Text>
                    <Text variant="small">{mailerLabel}</Text>
                  </Flex>
                  {!isPhpMailer && (
                    <Flex gap={1} align="center">
                      <Text variant="small" color="subdued">
                        {__('Encryption:', 'kirki-ecommerce')}
                      </Text>
                      <Text variant="small">{encryptionLabel}</Text>
                    </Flex>
                  )}

                  {!isPhpMailer && (
                    <>
                      <Flex gap={1} align="center">
                        <Text variant="small" color="subdued">
                          {__('Host:', 'kirki-ecommerce')}
                        </Text>
                        <Text variant="small">{hostLabel}</Text>
                      </Flex>
                      <Flex gap={1} align="center">
                        <Text variant="small" color="subdued">
                          {__('Port:', 'kirki-ecommerce')}
                        </Text>
                        <Text variant="small">{portLabel}</Text>
                      </Flex>
                      <Flex gap={1} align="center">
                        <Text variant="small" color="subdued">
                          {__('Username:', 'kirki-ecommerce')}
                        </Text>
                        <Text variant="small">{usernameLabel}</Text>
                      </Flex>
                      <Flex gap={1} align="center">
                        <Text variant="small" color="subdued">
                          {__('Password:', 'kirki-ecommerce')}
                        </Text>
                        <Text variant="small">{passwordLabel}</Text>
                      </Flex>
                    </>
                  )}
                </Flex>
              </CardContent>
            </Card>
          )}
        </Flex>
      </CardContent>
      <MailConfigurationDialog
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        onSave={handleSaveMailConfiguration}
      />
    </Card>
  );
};

MailConfiguration.displayName = 'MailConfiguration';

export default MailConfiguration;
