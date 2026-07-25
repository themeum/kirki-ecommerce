import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import ColorPickerField from '@/components/form/color-picker-field';
import TextField from '@/components/form/text-field';
import ThumbnailField from '@/components/form/thumbnail-field';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Field, FieldError } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import PageHeading from '@/components/ui/page-heading';
import ProgressBar from '@/components/ui/progressbar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Text from '@/components/ui/text';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  BrushIcon,
  SendIcon,
} from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import {
  EmailTemplateFormSchema,
  emailTemplateDefaultValues,
  type EmailTemplateFormValues,
} from '@/schemas/forms/email-template-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type {
  EmailTemplate as SettingsEmailTemplate,
  SettingsSectionData,
} from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { cardStyles } from '@/theme/card-styles';

const POSITION_MAP: Record<string, number> = {
  start: 0,
  center: 1,
  end: 2,
};

const INDEX_TO_POSITION = ['start', 'center', 'end'];

const resolveLogoUrl = (logo: EmailTemplateFormValues['logo']) => {
  if (!logo) {
    return '';
  }
  if (typeof logo === 'string') {
    return logo;
  }
  if (typeof logo === 'object' && 'url' in logo) {
    return String(logo.url ?? '');
  }
  return '';
};

const EditTemplate = () => {
  const { data: emailSettingsData, isLoading } = useSettingsQuery('email');
  const { mutateAsync: saveSettings, isPending } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(emailSettingsData);
  const defaultEmail = emailSettingsData?.default_template as
    | EmailTemplateFormValues
    | undefined;

  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(EmailTemplateFormSchema),
    defaultValues: emailTemplateDefaultValues,
  });

  const heightValue = form.watch('height') ?? 50;

  useEffect(() => {
    if (!defaultEmail) {
      return;
    }

    form.reset({
      ...emailTemplateDefaultValues,
      ...defaultEmail,
      logo: resolveLogoUrl(defaultEmail.logo),
      height: parseInt(String(defaultEmail.height), 10) || 50,
      position: defaultEmail.position || 'start',
      colors: {
        ...emailTemplateDefaultValues.colors,
        ...(defaultEmail.colors ?? {}),
      },
    });
  }, [defaultEmail, form]);

  const handleSaveData = async (values: EmailTemplateFormValues) => {
    if (!emailSettingsData) {
      return;
    }

    const payload: SettingsSectionData = {
      ...emailSettingsData,
      default_template: {
        ...(emailSettingsData.default_template as SettingsEmailTemplate),
        ...values,
        logo: resolveLogoUrl(values.logo),
        height: `${values.height ?? 50}px`,
      } as SettingsEmailTemplate,
    };

    try {
      await saveSettings({ key: 'email', data: payload });
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse, {
        stripPrefix: 'data.default_template.',
      });
    }
  };

  const handleDiscard = () => {
    form.reset();
  };

  return (
    <>
      <PageHeading
        text={__('Edit Template', 'kirki-ecommerce')}
        hasBack
        css={styles.pageHeading}
        leftIcon={<BrushIcon />}
        size="fullWidth"
        sticky
        actions={
          <>
            <Button variant="ghost" onClick={handleDiscard}>
              {__('Discard', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSaveData)}
              loading={isPending}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container size="fullWidth" css={styles.container}>
        {loaded ? (
          <Form {...form}>
            <Flex gap={12} css={css({ width: '100%' })}>
              <Flex direction="column" gap={5} css={css({ width: '44%' })}>
                <Card css={[cardStyles.largeCard, styles.roundedCard]}>
                  <CardContent css={cardStyles.largeContentPadded}>

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
                  getPreviewUrl={(value) => resolveLogoUrl(value as EmailTemplateFormValues['logo'])}
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
                          label={'Height'}
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
                <Card css={[cardStyles.largeCard, styles.roundedCard]}>
                  <CardContent css={cardStyles.largeContentPadded}>

                  <Flex direction="column" gap={2}>
                    <Text weight="semibold">Colors</Text>
                    <Text color="secondary">
                      Style how the emails will look
                    </Text>
                  </Flex>
                  <ColorPickerField
                  name="colors.background"
                  label={'Background'}
                  />
                  <ColorPickerField name="colors.text" label={'Text'} />
                  <ColorPickerField name="colors.link" label={'Link'} />
                  <ColorPickerField name="colors.label" label={'Label'} />
                  <ColorPickerField
                  name="colors.button"
                  label={'Button Color'}
                  />
                  <ColorPickerField
                  name="colors.button_bg"
                  label={'Button BG'}
                  />
                  </CardContent>
                </Card>
              </Flex>

              <Flex direction="column" gap={4} css={css({ width: '56%' })}>
                <Flex
                  align="center" justify="space-between">
                  <Text weight="semibold">Template Preview</Text>
                  <Flex gap={2} align="center">
                    <SendIcon />
                    <Text css={styles.sendTextMail}>Send Text Mail</Text>
                  </Flex>
                </Flex>
                <Card css={styles.squareCard}>
                  <CardContent>
                  </CardContent>
                </Card>
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

const styles = {
  pageHeading: scoped({
    ...theme.typography.paragraph(),
    padding: `${theme.spacing[0]} ${theme.spacing[8]}`,
    height: '32px',
  }),
  container: scoped({
    width: '100%',
    padding: `${theme.spacing[3]} 103px`,
  }),
  roundedCard: scoped({
    borderRadius: theme.radius.lg,
  }),
  squareCard: scoped({
    borderRadius: theme.radius.none,
  }),
  sendTextMail: scoped({
    ...theme.typography.small(),
  }),
};
