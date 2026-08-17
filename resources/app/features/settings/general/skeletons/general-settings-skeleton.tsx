import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { HomeIcon } from '@/icons';
import { __ } from '@/wpi18n';

const GeneralSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[4, 4, 2, 2, 2]}
    header={
      <SettingsPageHeader
        icon={<HomeIcon />}
        title={__('General', 'kirki-ecommerce')}
      />
    }
  />
);

GeneralSettingsSkeleton.displayName = 'GeneralSettingsSkeleton';

export default GeneralSettingsSkeleton;
