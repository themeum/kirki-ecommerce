import { Controller, useFormContext } from 'react-hook-form';

import { FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import type { MailConfigurationFormInput } from '@/features/settings/email/schemas/forms/mail-configuration-form';
import { __ } from '@/wpi18n';

const AuthenticationSwitchField = () => {
  const { control } = useFormContext<MailConfigurationFormInput>();

  return (
    <Controller
      control={control}
      name="is_authentication_enabled"
      render={({ field }) => (
        <Flex justify="space-between" align="center" gap={4}>
          <Flex direction="column" gap={1}>
            <FieldLabel htmlFor="is_authentication_enabled">
              {__('Authentication', 'kirki-ecommerce')}
            </FieldLabel>
            <Text color="secondary" variant="small">
              {__(
                'Turn on if your mail server asks for a username and password.',
                'kirki-ecommerce',
              )}
            </Text>
          </Flex>
          <Switch
            id="is_authentication_enabled"
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
          />
        </Flex>
      )}
    />
  );
};

AuthenticationSwitchField.displayName = 'AuthenticationSwitchField';

export default AuthenticationSwitchField;
