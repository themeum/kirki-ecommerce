import RichTextField from '@/components/form/rich-text-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import EmailNotificationTemplatePreview from '@/features/settings/email/components/email-notification-template-preview/email-notification-template-preview';
import EmailNotificationTemplateLayout from '@/features/settings/email/components/layouts/email-notification-template-layout';
import { EditNotificationTemplateProvider } from '@/features/settings/email/contexts/edit-notification-template-context';
import { useEditNotificationTemplate } from '@/features/settings/email/hooks/use-edit-notification-template';
import { emailTemplateStyles } from '@/features/settings/email/lib/template';
import { useSendNotificationTestEmailMutation } from '@/features/settings/email/services/email-notification-template';
import EditNotificationTemplateSkeleton from '@/features/settings/email/skeletons/edit-notification-template-skeleton';
import { SendIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const EditNotificationTemplateContent = () => {
  const { form, ref, loaded, shortcodes } = useEditNotificationTemplate();
  const sendTestEmailMutation = useSendNotificationTestEmailMutation();

  if (!loaded) {
    return <EditNotificationTemplateSkeleton />;
  }

  const handleSendTestEmail = form.handleSubmit((payload) => {
    sendTestEmailMutation.mutate({ type: ref.type, group: ref.group, key: ref.key, data: payload });
  });

  return (
    <EmailNotificationTemplateLayout>
      <Flex gap={12} cssOverride={{ width: '100%' }}>
        <Flex direction="column" gap={5} cssOverride={{ width: '40%' }}>
          <Card
            data-search-skip="true"
            cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
          >
            <CardContent>
              <Flex direction="column" gap={4}>
                <TextField name="subject" label={__('Subject', 'kirki-ecommerce')} />
                <TextField name="heading" label={__('Heading', 'kirki-ecommerce')} />
                <RichTextField
                  name="message"
                  label={__('Content', 'kirki-ecommerce')}
                  shortcodes={shortcodes}
                />
              </Flex>
            </CardContent>
          </Card>
        </Flex>

        <Flex direction="column" gap={4} cssOverride={{ width: '60%' }}>
          <Flex align="center" justify="space-between">
            <Text weight="semibold">{__('Template Preview', 'kirki-ecommerce')}</Text>
            <Button
              variant="ghost"
              onClick={handleSendTestEmail}
              loading={sendTestEmailMutation.isPending}
            >
              <SendIcon />
              {__('Send Test Mail', 'kirki-ecommerce')}
            </Button>
          </Flex>
          <Card
            cssOverride={mergeCss(
              cardStyles.innerCard,
              emailTemplateStyles.squareCard,
              styles.previewCard,
            )}
          >
            <CardContent cssOverride={styles.previewCardContent}>
              <EmailNotificationTemplatePreview templateRef={ref} form={form} />
            </CardContent>
          </Card>
        </Flex>
      </Flex>
    </EmailNotificationTemplateLayout>
  );
};

EditNotificationTemplateContent.displayName = 'EditNotificationTemplateContent';

const EditNotificationTemplate = () => (
  <EditNotificationTemplateProvider>
    <EditNotificationTemplateContent />
  </EditNotificationTemplateProvider>
);

EditNotificationTemplate.displayName = 'EditNotificationTemplate';

export default EditNotificationTemplate;

const styles = defineStyles({
  previewCard: {
    padding: 0,
  },
  previewCardContent: {
    paddingInline: 0,
  },
});
