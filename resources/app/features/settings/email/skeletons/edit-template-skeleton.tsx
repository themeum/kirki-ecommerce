import { BrushIcon } from 'lucide-react';

import Flex from '@/components/ui/flex';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { emailTemplateStyles } from '@/features/settings/email/lib/template';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { __ } from '@/wpi18n';

const EditTemplateSkeleton = () => (
  <Page>
    <PageHeading hasBack leftIcon={<BrushIcon />} text={__('Email Template', 'kirki-ecommerce')} />
    <PageContent containerSize="xl" cssOverride={emailTemplateStyles.container}>
      <Flex gap={12} cssOverride={{ width: '100%' }}>
        <Flex direction="column" gap={5} cssOverride={{ width: '40%' }}>
          <SettingsPageSkeleton cards={[3, 5, 3, 3]} />
        </Flex>
        <Flex direction="column" gap={4} cssOverride={{ width: '60%' }}>
          <SettingsPageSkeleton cards={[20]} />
        </Flex>
      </Flex>
    </PageContent>
  </Page>
);

EditTemplateSkeleton.displayName = 'EditTemplateSkeleton';

export default EditTemplateSkeleton;
