import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';
import { EnvelopeClosedIcon } from '@radix-ui/react-icons';

const EmailSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[1, 3, 4]}
      header={
        <SettingsPageHeader icon={<EnvelopeClosedIcon />} title={__('Email', 'kirki-ecommerce')} />
      }
    />
  </Container>
);

EmailSettingsSkeleton.displayName = 'EmailSettingsSkeleton';

export default EmailSettingsSkeleton;
