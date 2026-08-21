import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { CurrencyIcon } from '@/icons';
import { __ } from '@/wpi18n';

const MultiCurrencySettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[2, 3]}
    header={
      <SettingsPageHeader
        icon={<CurrencyIcon />}
        title={__('Currency', 'kirki-ecommerce')}
      />
    }
  />
);

MultiCurrencySettingsSkeleton.displayName = 'MultiCurrencySettingsSkeleton';

export default MultiCurrencySettingsSkeleton;
