import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { CurrencyIcon } from '@/icons';
import { __ } from '@/wpi18n';

const MultiCurrencySettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[2, 3]}
      header={
        <SettingsPageHeader icon={<CurrencyIcon />} title={__('Currency', 'kirki-ecommerce')} />
      }
    />
  </Container>
);

MultiCurrencySettingsSkeleton.displayName = 'MultiCurrencySettingsSkeleton';

export default MultiCurrencySettingsSkeleton;
