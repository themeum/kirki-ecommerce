import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import { Field, FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import ProgressBar from '@/components/ui/progressbar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { EmailSettingsFormSchema } from '@/features/settings/email/schemas/forms/email-settings-form';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { AlignCenterIcon, AlignLeftIcon, BrushIcon, SendIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import {
  type EmailTemplateFormInput,
  type EmailTemplateFormPayload,
  EmailTemplateFormSchema,
} from '@/schemas/forms/email-template-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const POSITION_MAP: Record<string, number> = {
  start: 0,
  center: 1,
  end: 2,
};

const INDEX_TO_POSITION = ['start', 'center', 'end'];

const resolveLogoUrl = (logo: unknown): string => {
  if (!logo) {
    return '';
  }
  if (typeof logo === 'string') {
    return logo;
  }
  if (typeof logo === 'object' && 'url' in logo) {
    return String((logo as { url?: string }).url ?? '');
  }
  return '';
};

const EditTemplate = () => {
  const navigate = useNavigate();
  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation<'email'>();

  const loaded = !isLoading && Boolean(emailSettingsData);
  const defaultEmail = emailSettingsData?.default_template as
    | Record<string, unknown>
    | undefined;

  const form = useForm<EmailTemplateFormInput, unknown, EmailTemplateFormPayload>({
    resolver: zodResolver(EmailTemplateFormSchema),
    defaultValues: getDefaults(EmailTemplateFormSchema),
  });

  const heightValue = form.watch('height') ?? 50;
  const { isDirty } = form.formState;

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (!defaultEmail) {
      return;
    }

    form.reset(
      pickFormValues(EmailTemplateFormSchema, defaultEmail, {
        logo: resolveLogoUrl(defaultEmail.logo),
        height: parseInt(String(defaultEmail.height), 10) || 50,
      }),
    );
  }, [defaultEmail, form]);

  const handleSaveData = async (payload: EmailTemplateFormPayload) => {
    if (!emailSettingsData) {
      return;
    }

    try {
      const currentEmailSettings = EmailSettingsFormSchema.parse(
        pickFormValues(EmailSettingsFormSchema, emailSettingsData),
      );

      await saveSettings({
        key: 'email',
        data: {
          admin_emails: currentEmailSettings.admin_emails,
          customer_emails: currentEmailSettings.customer_emails,
          default_template: {
            ...(emailSettingsData.default_template ?? {}),
            ...payload,
          },
        },
      });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix: 'data.default_template.',
      });
    }
  };

  const handleDiscard = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty,
    isSaving: isPending,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscard,
  });

  return (
    <>
      <Container size="fullWidth" cssOverride={styles.container}>
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4} cssOverride={{ width: '100%' }}>
              <SettingsPageHeader
                icon={<BrushIcon />}
                title={__('Edit Template', 'kirki-ecommerce')}
                onBack={() => navigate(RouteConfig.Settings.get('EmailSettings').buildLink())}
              />
              <Flex gap={12} cssOverride={{ width: '100%' }}>
                <Flex direction="column" gap={5} cssOverride={{ width: '44%' }}>
                  <Card cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
                    <CardContent >

                      <Flex direction="column" gap={2}>
                        <Text weight="semibold">Logo</Text>
                        <Text color="secondary">
                          Update the logo & style your way
                        </Text>
                      </Flex>
                      <ThumbnailField
                        name="logo"
                        placeholder={__(
                          'Drag and drop, or upload images',
                          'kirki-ecommerce',
                        )}
                        description={__('Set store logo', 'kirki-ecommerce')}
                        getPreviewUrl={(value) => resolveLogoUrl(value)}
                      />
                      <TextField
                        name="height"
                        label={__('Height', 'kirki-ecommerce')}
                        type="number"
                      />
                      <Controller
                        control={form.control}
                        name="height"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <ProgressBar
                              value={Number(field.value) || 0}
                              onChange={(value) => field.onChange(value)}
                              label={__('Height', 'kirki-ecommerce')}
                              rightText={`${heightValue}px`}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="position"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <Tabs
                              value={String(
                                POSITION_MAP[field.value || ''] ?? 0,
                              )}
                              onValueChange={(value) => {
                                field.onChange(
                                  INDEX_TO_POSITION[Number(value)] || 'start',
                                );
                              }}
                            >
                              <TabsList>
                                <TabsTrigger value="0">
                                  <AlignLeftIcon />
                                </TabsTrigger>
                                <TabsTrigger value="1">
                                  <AlignCenterIcon />
                                </TabsTrigger>
                                <TabsTrigger value="2">
                                  <AlignLeftIcon
                                    style={{ transform: 'scaleX(-1)' }}
                                  />
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </CardContent>
                  </Card>
                  <Card cssOverride={mergeCss(cardStyles.formCard, styles.roundedCard)}>
                    <CardContent >

                      <Flex direction="column" gap={2}>
                        <Text weight="semibold">Colors</Text>
                        <Text color="secondary">
                          Style how the emails will look
                        </Text>
                      </Flex>
                      <ColorPickerField
                        name="colors.background"
                        label="Background"
                      />
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
                  <Flex
                    align="center" justify="space-between">
                    <Text weight="semibold">Template Preview</Text>
                    <Flex gap={2} align="center">
                      <SendIcon />
                      <Text cssOverride={styles.sendTextMail}>Send Text Mail</Text>
                    </Flex>
                  </Flex>
                  <Card cssOverride={styles.squareCard}>
                    <CardContent />
                  </Card>
                </Flex>
              </Flex>
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

EditTemplate.displayName = 'EditTemplate';

export default EditTemplate;

const styles = defineStyles({
  container: {
    width: '100%',
    padding: `${theme.spacing[3]} 103px`,
  },
  roundedCard: {
    borderRadius: theme.radius.lg,
  },
  squareCard: {
    borderRadius: theme.radius.none,
  },
  sendTextMail: {
    ...theme.typography.small(),
  },
});
