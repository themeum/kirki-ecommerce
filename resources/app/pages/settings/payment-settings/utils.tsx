import PasswordField from '@/components/form/password-field';
import TextField from '@/components/form/text-field';
import Flex from '@/molecules/flex';
import { __ } from '@/wpi18n';

type GatewayField = {
  name: string;
  label?: string;
  type?: string;
};

type DynamicGatewayFieldsProps = {
  fields?: GatewayField[];
};

export const DynamicGatewayFields = ({
  fields = [],
}: DynamicGatewayFieldsProps) => {
  return (
    <>
      {fields.map((field) => {
        if (field?.type !== 'text') {
          return null;
        }

        const isSecret = field.name.includes('secret');

        return (
          <Flex key={field.name} gap={8} style={{ alignItems: 'center' }}>
            {isSecret ? (
              <PasswordField
                name={field.name}
                label={field.label}
                placeholder={__('Type here', 'kirki-ecommerce')}
              />
            ) : (
              <TextField
                name={field.name}
                label={field.label}
                placeholder={__('Type here', 'kirki-ecommerce')}
              />
            )}
          </Flex>
        );
      })}
    </>
  );
};
