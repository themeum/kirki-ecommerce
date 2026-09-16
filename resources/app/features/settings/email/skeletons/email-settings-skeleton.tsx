import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { AtSignIcon } from '@/icons';
import { __ } from '@/wpi18n';

const EmailSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[1, 3, 4]}
      header={<SettingsPageHeader icon={<AtSignIcon />} title={__('Email', 'kirki-ecommerce')} />}
    />
  </Container>
);

EmailSettingsSkeleton.displayName = 'EmailSettingsSkeleton';

export default EmailSettingsSkeleton;
