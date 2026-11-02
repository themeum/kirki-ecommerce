import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useEmailTemplatePreviewAutoHeight } from '@/features/settings/email/hooks/use-email-template-preview-auto-height';
import { useEmailTemplatePreviewSync } from '@/features/settings/email/hooks/use-email-template-preview-sync';
import type {
  EmailTemplateFormInput,
  EmailTemplateFormPayload,
} from '@/features/settings/email/schemas/forms/email-template-form';
import { useEmailTemplatePreviewQuery } from '@/features/settings/email/services/email-template-preview';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type EmailTemplatePreviewProps = {
  form: UseFormReturn<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>;
};

const EmailTemplatePreview = ({ form }: EmailTemplatePreviewProps) => {
  const { data, isLoading } = useEmailTemplatePreviewQuery();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEmailTemplatePreviewSync(iframeRef, form, isReady);
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
      title={__('Email template preview', 'kirki-ecommerce')}
      srcDoc={data.html}
      onLoad={() => setIsReady(true)}
      css={scoped(styles.frame)}
    />
  );
};

EmailTemplatePreview.displayName = 'EmailTemplatePreview';

export default EmailTemplatePreview;

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
