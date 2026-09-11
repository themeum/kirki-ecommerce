import { Hammer, SlidersHorizontalIcon, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import PageTable from '@/features/settings/advanced/components/page-table';
import { usePageRunFixMutation } from '@/features/settings/advanced/services/page-settings';
import AdvancedSettingsSkeleton from '@/features/settings/advanced/skeletons/advanced-settings-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { useSettingsQuery } from '@/services/settings';
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
  const { data: advancedSettings, isLoading } = useSettingsQuery('advance');

  const runFixMutation = usePageRunFixMutation();

  const pages = useMemo(() => advancedSettings?.pages ?? [], [advancedSettings]);

  const hasPageError = useMemo(() => pages.some((page) => page.status !== 'active'), [pages]);

  return !isLoading ? (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<SlidersHorizontalIcon size={16} />}
          title={__('Advanced', 'kirki-ecommerce')}
        />
        <Card
          data-search-id="advanced.pages"
          data-search-keywords="cart page, my account page, thank you page, shop page, page assignment, permalink, endpoint"
          cssOverride={cardStyles.formCard}
        >
          <CardContent>
            <Flex direction="column" gap={2}>
              <Flex justify="space-between" align="center">
                <Text weight="semibold">{__('Pages', 'kirki-ecommerce')}</Text>
                <Button
                  onClick={() => void runFixMutation.mutate()}
                  loading={runFixMutation.isPending}
                  disabled={!hasPageError || runFixMutation.isPending}
                >
                  <Hammer size="12" />
                  {__('Run Fix', 'kirki-ecommerce')}
                </Button>
              </Flex>
              <Text variant="small" color="secondary">
                {__(
                  'Which WordPress pages your storefront uses, and repairing missing ones.',
                  'kirki-ecommerce',
                )}
              </Text>
              <Flex direction="column" gap={3} cssOverride={styles.contentWrapper}>
                {hasPageError && <Alert type="warning" text={<AlertMessage />} hasHighlight />}
                <PageTable pages={pages} />
              </Flex>
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  ) : (
    <AdvancedSettingsSkeleton />
  );
};

AdvancedSettings.displayName = 'AdvancedSettings';

export default AdvancedSettings;

const styles = defineStyles({
  contentWrapper: {
    padding: `${theme.spacing[2]} 0}`,
  },
});
