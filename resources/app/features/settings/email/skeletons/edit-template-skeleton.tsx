import Container from '@/components/ui/container';
import { emailTemplateStyles } from '@/features/settings/email/lib/template';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { BrushIcon } from '@/icons';
import { __ } from '@/wpi18n';

const EditTemplateSkeleton = () => (
  <Container size="fullWidth" cssOverride={emailTemplateStyles.container}>
    <SettingsPageSkeleton
      cards={[2, 4, 3]}
      header={
        <SettingsPageHeader icon={<BrushIcon />} title={__('Edit Template', 'kirki-ecommerce')} />
      }
    />
  </Container>
);

EditTemplateSkeleton.displayName = 'EditTemplateSkeleton';

export default EditTemplateSkeleton;
