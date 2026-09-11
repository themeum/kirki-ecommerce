import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';
import { Home } from 'lucide-react';

const GeneralSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[4, 4, 2, 2, 2]}
    header={
      <SettingsPageHeader icon={<Home size={16} />} title={__('General', 'kirki-ecommerce')} />
    }
  />
);

GeneralSettingsSkeleton.displayName = 'GeneralSettingsSkeleton';

export default GeneralSettingsSkeleton;
