import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { SnowflakeIcon } from '@/icons';
import { __ } from '@/wpi18n';

const EssentialsSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[4, 4]}
      header={
        <SettingsPageHeader icon={<SnowflakeIcon />} title={__('Essentials', 'kirki-ecommerce')} />
      }
    />
  </Container>
);

EssentialsSettingsSkeleton.displayName = 'EssentialsSettingsSkeleton';

export default EssentialsSettingsSkeleton;
