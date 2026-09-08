import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { TaxIcon } from '@/icons';
import { __ } from '@/wpi18n';

const TaxSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[2, 3, 2]}
      header={<SettingsPageHeader icon={<TaxIcon />} title={__('Tax', 'kirki-ecommerce')} />}
    />
  </Container>
);

TaxSettingsSkeleton.displayName = 'TaxSettingsSkeleton';

export default TaxSettingsSkeleton;
