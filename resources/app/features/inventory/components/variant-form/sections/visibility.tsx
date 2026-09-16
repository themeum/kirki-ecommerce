import SwitchField from '@/components/form/switch-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const Visibility = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>
          <Flex justify="space-between">
            <span>{__('Visibility', 'kirki-ecommerce')}</span>
            <SwitchField name="is_visible" cssOverride={{ width: 'auto' }} />
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Text variant="tiny" color="secondary">
          {__('Hidden variants are not available for customers to buy.', 'kirki-ecommerce')}
        </Text>
      </CardContent>
    </Card>
  );
};

Visibility.displayName = 'Visibility';

export default Visibility;
