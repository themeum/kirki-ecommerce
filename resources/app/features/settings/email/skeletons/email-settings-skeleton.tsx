import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { AtSignIcon } from '@/icons';
import { __ } from '@/wpi18n';

const EmailSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[3, 4]}
    header={
      <SettingsPageHeader
        icon={<AtSignIcon />}
        title={__('Email', 'kirki-ecommerce')}
      />
    }
  />
);

EmailSettingsSkeleton.displayName = 'EmailSettingsSkeleton';

export default EmailSettingsSkeleton;
