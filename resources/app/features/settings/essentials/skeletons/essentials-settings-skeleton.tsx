import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { SnowflakeIcon } from '@/icons';
import { __ } from '@/wpi18n';

const EssentialsSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[4, 4]}
    header={
      <SettingsPageHeader
        icon={<SnowflakeIcon />}
        title={__('Essentials', 'kirki-ecommerce')}
      />
    }
  />
);

EssentialsSettingsSkeleton.displayName = 'EssentialsSettingsSkeleton';

export default EssentialsSettingsSkeleton;
