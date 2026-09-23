import CheckboxField from '@/components/form/checkbox-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { FileTextIcon } from '@/icons';
import { __ } from '@/wpi18n';

type CustomerOverviewProps = {
  isNew?: boolean;
};

const CustomerOverview = ({ isNew = true }: CustomerOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <Flex gap={2} align="center">
          <FileTextIcon />
          <Text weight="semibold">{__('Basic info', 'kirki-ecommerce')}</Text>
        </Flex>
      </CardHeader>
      <CardContent>
        <Flex direction="column" gap={4}>
          <TextField
            name="first_name"
            label={__('First Name', 'kirki-ecommerce')}
            placeholder={__('e.g. John', 'kirki-ecommerce')}
          />
          <TextField
            name="last_name"
            label={__('Last Name', 'kirki-ecommerce')}
            placeholder={__('e.g. Musk', 'kirki-ecommerce')}
          />
          <TextField
            name="email"
            label={__('Email', 'kirki-ecommerce')}
            type="email"
            placeholder={__('example@yourmail.com', 'kirki-ecommerce')}
            disabled={!isNew}
          />
          <TextField
            name="phone"
            label={__('Phone Number', 'kirki-ecommerce')}
            type="tel"
            placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
          />
          {/* Hidden per design for now - accepts_marketing still defaults to false, to be surfaced later */}
          {isNew && (
            <CheckboxField
              name="create_wordpress_user"
              label={__('Create WordPress user', 'kirki-ecommerce')}
            />
          )}
        </Flex>
      </CardContent>
    </Card>
  );
};

CustomerOverview.displayName = 'CustomerOverview';

export default CustomerOverview;
