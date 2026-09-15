import ColorPickerField from '@/components/form/color-picker-field';
import MediaField from '@/components/form/media-field';
import ProgressBarField from '@/components/form/progress-bar-field';
import RichTextField from '@/components/form/rich-text-field';
import TabsField from '@/components/form/tabs-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import EmailTemplatePreview from '@/features/settings/email/components/email-template-preview/email-template-preview';
import EmailTemplateLayout from '@/features/settings/email/components/layouts/email-template-layout';
import { EditTemplateProvider } from '@/features/settings/email/contexts/edit-template-context';
import { useEditTemplate } from '@/features/settings/email/hooks/use-edit-template';
import {
  emailTemplateStyles,
  positionToTabIndex,
  tabIndexToPosition,
} from '@/features/settings/email/lib/template';
import { useSendTestEmailMutation } from '@/features/settings/email/services/email-template-preview';
import EditTemplateSkeleton from '@/features/settings/email/skeletons/edit-template-skeleton';
import { AlignCenterIcon, AlignLeftIcon, SendIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const EditTemplateContent = () => {
  const { form, loaded, heightValue } = useEditTemplate();
  const sendTestEmailMutation = useSendTestEmailMutation();

  const handleSendTestEmail = form.handleSubmit((payload) => {
    sendTestEmailMutation.mutate(payload);
  });

  if (!loaded) {
    return <EditTemplateSkeleton />;
  }

  return (
    <EmailTemplateLayout>
      <Flex gap={12} cssOverride={{ width: '100%' }}>
        <Flex direction="column" gap={5} cssOverride={{ width: '40%' }}>
          <Card
            data-search-skip="true"
            cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
          >
            <CardContent>
              <Flex direction="column" gap={4}>
                <Flex direction="column" gap={2}>
                  <Text variant="heading6" weight="semibold">
                    {__('Logo', 'kirki-ecommerce')}
                  </Text>
                  <Text variant="small" color="subdued">
                    {__('Update the logo & style your way', 'kirki-ecommerce')}
                  </Text>
                </Flex>
                <MediaField
                  name="logo"
                  placeholder={__('Drag and drop, or upload images', 'kirki-ecommerce')}
                />
                <TextField name="height" label={__('Height', 'kirki-ecommerce')} type="number" />
                <ProgressBarField
                  name="height"
                  label={__('Height', 'kirki-ecommerce')}
                  rightText={`${heightValue}px`}
                />
                <TabsField
                  name="position"
                  label={__('Position', 'kirki-ecommerce')}
                  options={[
                    { value: '0', icon: <AlignLeftIcon /> },
                    { value: '1', icon: <AlignCenterIcon /> },
                    {
                      value: '2',
                      icon: <AlignLeftIcon style={{ transform: 'scaleX(-1)' }} />,
                    },
                  ]}
                  toTabValue={(value) => positionToTabIndex(value as string)}
                  fromTabValue={(value) => tabIndexToPosition(value)}
                />
              </Flex>
            </CardContent>
          </Card>
          <Card
            data-search-skip="true"
            cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
          >
            <CardContent>
              <Flex direction="column" gap={4}>
                <Flex direction="column" gap={2}>
                  <Text weight="semibold">{__('Colors', 'kirki-ecommerce')}</Text>
                  <Text color="secondary">
                    {__('Style how the emails will look', 'kirki-ecommerce')}
                  </Text>
                </Flex>

                <Flex direction="column" gap={3}>
                  <Text variant="small" weight="semibold">
                    {__('Background', 'kirki-ecommerce')}
                  </Text>
                  <Grid columns={2} cssOverride={styles.colorGrid}>
                    <ColorPickerField
                      name="colors.background.email_body"
                      label={__('Email Body', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.background.outer_area"
                      label={__('Outer Area', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.background.info_cads"
                      label={__('Info Cards', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.background.divider"
                      label={__('Divider', 'kirki-ecommerce')}
                    />
                  </Grid>
                </Flex>

                <Flex direction="column" gap={3}>
                  <Text variant="small" weight="semibold">
                    {__('Typography', 'kirki-ecommerce')}
                  </Text>
                  <Grid columns={2} cssOverride={styles.colorGrid}>
                    <ColorPickerField
                      name="colors.typography.headings"
                      label={__('Headings', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.typography.body"
                      label={__('Body', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.typography.muted"
                      label={__('Muted', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.typography.link"
                      label={__('Link', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.typography.exceptions"
                      label={__('Exceptions', 'kirki-ecommerce')}
                    />
                  </Grid>
                </Flex>

                <Flex direction="column" gap={3}>
                  <Text variant="small" weight="semibold">
                    {__('Button', 'kirki-ecommerce')}
                  </Text>
                  <Grid columns={2} cssOverride={styles.colorGrid}>
                    <ColorPickerField
                      name="colors.button.background"
                      label={__('Background', 'kirki-ecommerce')}
                    />
                    <ColorPickerField
                      name="colors.button.text"
                      label={__('Text', 'kirki-ecommerce')}
                    />
                  </Grid>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
          <Card
            data-search-skip="true"
            cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
          >
            <CardContent>
              <Flex direction="column" gap={4}>
                <Flex direction="column" gap={2}>
                  <Text weight="semibold">{__('Content', 'kirki-ecommerce')}</Text>
                  <Text color="secondary">
                    {__('Manage your email default contents.', 'kirki-ecommerce')}
                  </Text>
                </Flex>
                <RichTextField
                  name="additional_description"
                  label={__('Additional Description', 'kirki-ecommerce')}
                />
                <RichTextField name="footer" label={__('Footer', 'kirki-ecommerce')} />
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
              <EmailTemplatePreview form={form} />
            </CardContent>
          </Card>
        </Flex>
      </Flex>
    </EmailTemplateLayout>
  );
};

EditTemplateContent.displayName = 'EditTemplateContent';

const EditTemplate = () => (
  <EditTemplateProvider>
    <EditTemplateContent />
  </EditTemplateProvider>
);

EditTemplate.displayName = 'EditTemplate';

export default EditTemplate;

const styles = defineStyles({
  previewCard: {
    padding: 0,
  },
  previewCardContent: {
    paddingInline: 0,
  },
  colorGrid: {
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: theme.spacing[3],
    borderRadius: theme.radius.xl,
  },
});
