import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { TaxIcon } from '@/icons';
import { __ } from '@/wpi18n';

const TaxSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[3, 2]}
    header={
      <SettingsPageHeader
        icon={<TaxIcon />}
        title={__('Tax', 'kirki-ecommerce')}
      />
    }
  />
);

TaxSettingsSkeleton.displayName = 'TaxSettingsSkeleton';

export default TaxSettingsSkeleton;
