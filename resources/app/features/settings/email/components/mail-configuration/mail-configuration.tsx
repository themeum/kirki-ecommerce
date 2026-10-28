import { Edit3Icon, LucideCircleCheckBig, Mail, Wrench } from 'lucide-react';
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
import { isEmptyValue } from '@/libs/zod';
import { useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

import MailConfigurationDialog from './mail-configuration-dialog';

const isMailConfigured = (mailConfig: EmailSettingsFormInput['mail_configuration']) => {
  if (!isDefined(mailConfig)) {
    return false;
  }

  const isSmtp = mailConfig.mailer === 'smtp';

  if (!isSmtp) {
    return (
      !isEmptyValue(mailConfig.from_email) &&
      !isEmptyValue(mailConfig.from_name) &&
      !isEmptyValue(mailConfig.mailer)
    );
  }

  return (
    !isEmptyValue(mailConfig.from_email) &&
    !isEmptyValue(mailConfig.from_name) &&
    !isEmptyValue(mailConfig.mailer) &&
    !isEmptyValue(mailConfig.host) &&
    !isEmptyValue(mailConfig.port) &&
    !isEmptyValue(mailConfig.encryption) &&
    (mailConfig.is_authentication_enabled
      ? !isEmptyValue(mailConfig.username) && !isEmptyValue(mailConfig.password)
      : true)
  );
};

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

  const isConfigured = isMailConfigured(mailConfiguration);

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
                    <LucideCircleCheckBig size={16} />
                    {__('Configured', 'kirki-ecommerce')}
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
                <Wrench />
                {__('Configure', 'kirki-ecommerce')}
              </Button>
            )}
          </Flex>
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
