import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useEmailNotificationPreviewSync } from '@/features/settings/email/hooks/use-email-notification-preview-sync';
import { useEmailTemplatePreviewAutoHeight } from '@/features/settings/email/hooks/use-email-template-preview-auto-height';
import type { NotificationTemplateRef } from '@/features/settings/email/lib/utils';
import type {
  EmailNotificationTemplateFormInput,
  EmailNotificationTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-notification-template-form';
import { useEmailNotificationPreviewQuery } from '@/features/settings/email/services/email-notification-template';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type EmailNotificationTemplatePreviewProps = {
  templateRef: NotificationTemplateRef;
  form: UseFormReturn<
    EmailNotificationTemplateFormInput,
    unknown,
    EmailNotificationTemplateFormPayload
  >;
};

const EmailNotificationTemplatePreview = ({
  templateRef,
  form,
}: EmailNotificationTemplatePreviewProps) => {
  const { data, isLoading } = useEmailNotificationPreviewQuery(
    templateRef.type,
    templateRef.group,
    templateRef.key,
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEmailNotificationPreviewSync(iframeRef, form, data?.variables ?? {}, isReady);
  useEmailTemplatePreviewAutoHeight(iframeRef, isReady);

  if (isLoading || !data) {
    return (
      <Flex align="center" justify="center" cssOverride={styles.placeholder}>
        <Text color="secondary">{__('Loading preview…', 'kirki-ecommerce')}</Text>
      </Flex>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title={__('Email notification preview', 'kirki-ecommerce')}
      srcDoc={data.html}
      onLoad={() => setIsReady(true)}
      css={scoped(styles.frame)}
    />
  );
};

EmailNotificationTemplatePreview.displayName = 'EmailNotificationTemplatePreview';

export default EmailNotificationTemplatePreview;

const styles = defineStyles({
  frame: {
    display: 'block',
    width: '100%',
    border: 'none',
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    minHeight: '600px',
  },
});
