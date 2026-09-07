import { Hammer, SlidersHorizontalIcon, TriangleAlert } from 'lucide-react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import PageTable from '@/features/settings/advanced/components/page-table';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const AlertMessage = () => {
  return (
    <Flex direction="column" gap="2">
      <Flex gap="2" align="center">
        <TriangleAlert size="18" color={theme.colors.icon.warning} />
        <Text color="warning" variant="heading6" weight="semibold">
          {__('Missing/Inaccessible Pages Found', 'kirki-ecommerce')}
        </Text>
      </Flex>
      <Text color="warning" variant="paragraph" weight="normal">
        {__(
          'Some pages are currently unavailable. Click Run Fix to automatically restore missing pages or resolve status issues.',
          'kirki-ecommerce',
        )}
      </Text>
    </Flex>
  );
};

const AdvancedSettings = () => {
  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<SlidersHorizontalIcon />}
          title={__('Advanced', 'kirki-ecommerce')}
        />
        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <Flex direction="column" gap={2}>
              <Flex justify="space-between" align="center">
                <Text weight="semibold">{__('Pages', 'kirki-ecommerce')}</Text>
                <Button>
                  <Hammer size="12" />
                  {__('Run Fix', 'kirki-ecommerce')}
                </Button>
              </Flex>
              <Flex direction="column" gap={3} cssOverride={styles.contentWrapper}>
                <Alert type="warning" text={<AlertMessage />} hasHighlight />
                <PageTable />
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  );
};

AdvancedSettings.displayName = 'AdvancedSettings';

export default AdvancedSettings;

const styles = defineStyles({
  contentWrapper: {
    padding: `${theme.spacing[2]} 0}`,
  },
});
