import { useNavigate } from 'react-router';

import ColorPickerField from '@/components/form/color-picker-field';
import MediaField from '@/components/form/media-field';
import ProgressBarField from '@/components/form/progress-bar-field';
import TabsField from '@/components/form/tabs-field';
import TextField from '@/components/form/text-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useEditTemplate } from '@/features/settings/email/hooks/use-edit-template';
import {
  emailTemplateStyles,
  positionToTabIndex,
  tabIndexToPosition,
} from '@/features/settings/email/lib/template';
import EditTemplateSkeleton from '@/features/settings/email/skeletons/edit-template-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { AlignCenterIcon, AlignLeftIcon, BrushIcon, SendIcon } from '@/icons';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const EditTemplate = () => {
  const navigate = useNavigate();
  const { form, loaded, heightValue } = useEditTemplate();

  return (
    <>
      {loaded ? (
        <Container size="fullWidth" cssOverride={emailTemplateStyles.container}>
          <Form {...form}>
            <Flex direction="column" gap={4} cssOverride={{ width: '100%' }}>
              <SettingsPageHeader
                icon={<BrushIcon />}
                title={__('Edit Template', 'kirki-ecommerce')}
                onBack={() => navigate(RouteConfig.Settings.get('EmailSettings').buildLink())}
              />
              <Flex gap={12} cssOverride={{ width: '100%' }}>
                <Flex direction="column" gap={5} cssOverride={{ width: '44%' }}>
                  <Card
                    cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
                  >
                    <CardContent>
                      <Flex direction="column" gap={2}>
                        <Text weight="semibold">Logo</Text>
                        <Text color="secondary">Update the logo & style your way</Text>
                      </Flex>
                      <MediaField
                        name="logo"
                        placeholder={__('Drag and drop, or upload images', 'kirki-ecommerce')}
                        description={__('Set store logo', 'kirki-ecommerce')}
                      />
                      <TextField
                        name="height"
                        label={__('Height', 'kirki-ecommerce')}
                        type="number"
                      />
                      <ProgressBarField
                        name="height"
                        label={__('Height', 'kirki-ecommerce')}
                        rightText={`${heightValue}px`}
                      />
                      <TabsField
                        name="position"
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
                    </CardContent>
                  </Card>
                  <Card
                    cssOverride={mergeCss(cardStyles.formCard, emailTemplateStyles.roundedCard)}
                  >
                    <CardContent>
                      <Flex direction="column" gap={2}>
                        <Text weight="semibold">Colors</Text>
                        <Text color="secondary">Style how the emails will look</Text>
                      </Flex>
                      <ColorPickerField name="colors.background" label="Background" />
                      <ColorPickerField name="colors.text" label="Text" />
                      <ColorPickerField name="colors.link" label="Link" />
                      <ColorPickerField name="colors.label" label="Label" />
                      <ColorPickerField
                        name="colors.button"
                        label={__('Button Color', 'kirki-ecommerce')}
                      />
                      <ColorPickerField
                        name="colors.button_bg"
                        label={__('Button BG', 'kirki-ecommerce')}
                      />
                    </CardContent>
                  </Card>
                </Flex>

                <Flex direction="column" gap={4} cssOverride={{ width: '56%' }}>
                  <Flex align="center" justify="space-between">
                    <Text weight="semibold">Template Preview</Text>
                    <Flex gap={2} align="center">
                      <SendIcon />
                      <Text cssOverride={emailTemplateStyles.sendTextMail}>Send Text Mail</Text>
                    </Flex>
                  </Flex>
                  <Card cssOverride={emailTemplateStyles.squareCard}>
                    <CardContent />
                  </Card>
                </Flex>
              </Flex>
            </Flex>
          </Form>
        </Container>
      ) : (
        <EditTemplateSkeleton />
      )}
    </>
  );
};

EditTemplate.displayName = 'EditTemplate';

export default EditTemplate;
