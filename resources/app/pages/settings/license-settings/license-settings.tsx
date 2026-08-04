import Container from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { LicenseKeyIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import SettingsPageHeader from '@/pages/settings/settings-page-header';

const LicenseSettings = () => {
  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<LicenseKeyIcon />}
          title={__('License', 'kirki-ecommerce')}
        />
        <Card cssOverride={cardStyles.largeCard}>
          <CardContent cssOverride={cardStyles.largeContentPadded}>
            <Flex direction="column" gap={2}>
              <Text weight="semibold">
                {__('Coming soon', 'kirki-ecommerce')}
              </Text>
              <Text color="secondary">
                {__(
                  'License activation and management will appear here.',
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

LicenseSettings.displayName = 'LicenseSettings';

export default LicenseSettings;
