import { ScaleIcon } from 'lucide-react';

import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';

const LegalSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[3]}
      header={<SettingsPageHeader icon={<ScaleIcon />} title={__('Legal', 'kirki-ecommerce')} />}
    />
  </Container>
);

LegalSettingsSkeleton.displayName = 'LegalSettingsSkeleton';

export default LegalSettingsSkeleton;
