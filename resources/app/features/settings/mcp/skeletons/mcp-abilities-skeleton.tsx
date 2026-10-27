import { Bot } from 'lucide-react';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { RouteConfig } from '@/config/route-config';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { __ } from '@/wpi18n';

const GROUP_COUNT = 6;

const McpAbilitiesSkeleton = () => (
  <Container size="sm">
    <Flex direction="column" gap={4}>
      <SettingsPageHeader
        icon={<Bot size={16} />}
        title={__('Abilities', 'kirki-ecommerce')}
        breadcrumbs={[
          {
            label: __('MCP', 'kirki-ecommerce'),
            to: RouteConfig.Settings.get('McpSettings').buildLink(),
          },
        ]}
      />
      {Array.from({ length: GROUP_COUNT }, (_, index) => (
        <StackedListSkeleton key={index} rowCount={1} hasMedia={false} actionCount={1} />
      ))}
    </Flex>
  </Container>
);

McpAbilitiesSkeleton.displayName = 'McpAbilitiesSkeleton';

export default McpAbilitiesSkeleton;
