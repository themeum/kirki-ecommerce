import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { AdvancedSettingsIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const AdvancedSettings = () => {
  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<AdvancedSettingsIcon />}
          title={__('Advanced', 'kirki-ecommerce')}
        />
        <Card cssOverride={cardStyles.formCard}>
          <CardContent >
            <Flex direction="column" gap={2}>
              <Text weight="semibold">
                {__('Work in progress', 'kirki-ecommerce')}
              </Text>
              <Text color="secondary">
                {__(
                  'Advanced configuration options for your store will appear here.',
                  'kirki-ecommerce',
                )}
              </Text>
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  );
};

AdvancedSettings.displayName = 'AdvancedSettings';

export default AdvancedSettings;
