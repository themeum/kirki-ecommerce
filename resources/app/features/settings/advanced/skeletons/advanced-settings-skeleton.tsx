import { SlidersHorizontalIcon } from 'lucide-react';

import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';

const AdvancedSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[6]}
      header={
        <SettingsPageHeader
          icon={<SlidersHorizontalIcon />}
          title={__('Advanced', 'kirki-ecommerce')}
        />
      }
    />
  </Container>
);

AdvancedSettingsSkeleton.displayName = 'AdvancedSettingsSkeleton';

export default AdvancedSettingsSkeleton;
