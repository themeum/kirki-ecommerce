import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { AdvancedSettingsIcon } from '@/icons';
import { __ } from '@/wpi18n';

const AdvancedSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[2]}
    header={
      <SettingsPageHeader
        icon={<AdvancedSettingsIcon />}
        title={__('Advanced', 'kirki-ecommerce')}
      />
    }
  />
);

AdvancedSettingsSkeleton.displayName = 'AdvancedSettingsSkeleton';

export default AdvancedSettingsSkeleton;
