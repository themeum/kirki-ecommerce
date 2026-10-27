import { Bot } from 'lucide-react';

import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';

const McpSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[4, 1]}
      header={<SettingsPageHeader icon={<Bot size={16} />} title={__('MCP', 'kirki-ecommerce')} />}
    />
  </Container>
);

McpSettingsSkeleton.displayName = 'McpSettingsSkeleton';

export default McpSettingsSkeleton;
