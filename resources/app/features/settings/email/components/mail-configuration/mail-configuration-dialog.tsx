import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

import NumberField from '@/components/form/number-field';
import PasswordField from '@/components/form/password-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Grid from '@/components/ui/grid';
import AuthenticationSwitchField from '@/features/settings/email/components/fields/authentication-switch-field';
import type { EmailSettingsFormInput } from '@/features/settings/email/schemas/forms/email-settings-form';
import {
  type MailConfigurationFormInput,
  type MailConfigurationFormPayload,
  MailConfigurationFormSchema,
} from '@/features/settings/email/schemas/forms/mail-configuration-form';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const mailConfigurationDefaultValues = getDefaults(MailConfigurationFormSchema);

const MAILER_OPTIONS = [
  { label: __('SMTP', 'kirki-ecommerce'), value: 'smtp' },
  { label: __('PHP Mailer', 'kirki-ecommerce'), value: 'php_mail' },
];

const ENCRYPTION_OPTIONS = [
  { label: __('None', 'kirki-ecommerce'), value: 'none' },
  { label: __('SSL/TLS (SSL)', 'kirki-ecommerce'), value: 'ssl' },
  { label: __('STARTTLS (TLS)', 'kirki-ecommerce'), value: 'tls' },
];

type MailConfigurationDialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (values: MailConfigurationFormPayload) => Promise<void> | void;
};

const MailConfigurationDialog = ({
  isOpen,
  onClose = noop,
  onSave,
}: MailConfigurationDialogProps) => {
  const form = useForm<MailConfigurationFormInput, unknown, MailConfigurationFormPayload>({
    resolver: zodResolver(MailConfigurationFormSchema),
    defaultValues: mailConfigurationDefaultValues,
  });

  const { control } = useFormContext<EmailSettingsFormInput>();
  const mailConfiguration = useWatch({
    control,
    name: 'mail_configuration',
  });

  const mailer = useWatch({
    control: form.control,
    name: 'mailer',
  });

  const isEnabledAuthentication = useWatch({
    control: form.control,
    name: 'is_authentication_enabled',
  });

  const isSmtp = mailer === 'smtp';

  useEffect(() => {
    if (!isOpen) {
      form.reset(mailConfigurationDefaultValues);
      return;
    }

    form.reset(
      isDefined(mailConfiguration)
        ? {
            from_email: mailConfiguration.from_email,
            from_name: mailConfiguration.from_name,
            mailer: mailConfiguration.mailer,
            host: mailConfiguration.host,
            port: mailConfiguration.port,
            encryption: mailConfiguration.encryption,
            is_authentication_enabled: mailConfiguration.is_authentication_enabled,
            username: mailConfiguration.username,
            password: mailConfiguration.password,
          }
        : mailConfigurationDefaultValues,
    );
  }, [mailConfiguration, isOpen, form]);

  const handleConfiguration = async (values: MailConfigurationFormPayload) => {
    await onSave?.(values);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader cssOverride={styles.header}>
          <Flex gap={2} align="center">
            <Mail size={16} />
            <DialogTitle>{__('Mail Server Configuration', 'kirki-ecommerce')}</DialogTitle>
          </Flex>
        </DialogHeader>
        <Form {...form}>
          <form css={scoped(styles.form)} onSubmit={form.handleSubmit(handleConfiguration)}>
            <DialogBody cssOverride={styles.body}>
              <Flex direction="column" gap={4} data-check cssOverride={styles.fields}>
                <TextField
                  name="from_email"
                  type="email"
                  label={__('From email', 'kirki-ecommerce')}
                  placeholder={__('support@example.com', 'kirki-ecommerce')}
                />
                <TextField
                  name="from_name"
                  label={__('From name', 'kirki-ecommerce')}
                  placeholder={__('e.g. Jhon Doe', 'kirki-ecommerce')}
                />
                <SelectField
                  name="mailer"
                  label={__('Mailer', 'kirki-ecommerce')}
                  placeholder={__('Select mailer', 'kirki-ecommerce')}
                  options={MAILER_OPTIONS}
                />
                {isSmtp && (
                  <>
                    <TextField
                      name="host"
                      label={__('Host', 'kirki-ecommerce')}
                      placeholder={__('Enter the smtp host', 'kirki-ecommerce')}
                    />
                    <Grid columns={2} gap={4}>
                      <SelectField
                        name="encryption"
                        label={__('Encryption', 'kirki-ecommerce')}
                        placeholder={__('Select encryption', 'kirki-ecommerce')}
                        options={ENCRYPTION_OPTIONS}
                      />
                      <NumberField
                        name="port"
                        label={__('Port', 'kirki-ecommerce')}
                        placeholder={__('Enter the smtp port', 'kirki-ecommerce')}
                      />
                    </Grid>
                    <div css={scoped(styles.authCard)}>
                      <AuthenticationSwitchField />
                      <div
                        css={scopedMerge(
                          styles.collapse,
                          isEnabledAuthentication && styles.collapseOpen,
                        )}
                        inert={!isEnabledAuthentication}
                      >
                        <div css={scoped(styles.collapseContent)}>
                          <Flex direction="column" gap={4} cssOverride={styles.collapseFields}>
                            <TextField
                              name="username"
                              label={__('Username', 'kirki-ecommerce')}
                              placeholder={__('Enter the smtp username', 'kirki-ecommerce')}
                            />
                            <PasswordField
                              name="password"
                              label={__('Password', 'kirki-ecommerce')}
                              placeholder={__('Enter the smtp password', 'kirki-ecommerce')}
                            />
                          </Flex>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Flex>
            </DialogBody>
            <DialogFooter cssOverride={styles.footer}>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={form.formState.isSubmitting}>
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
              </DialogClose>
              <Button type="submit" variant="primary" loading={form.formState.isSubmitting}>
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

MailConfigurationDialog.displayName = 'MailConfigurationDialog';

export default MailConfigurationDialog;

const styles = defineStyles({
  header: {
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
  },
  body: {
    flex: '1 1 auto',
    minHeight: 0,
  },
  fields: {
    padding: theme.spacing[1],
  },
  authCard: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.solidSurfaceAlt,
  },
  collapse: {
    display: 'grid',
    gridTemplateRows: '0fr',
    opacity: 0,
    transition: 'grid-template-rows 250ms ease, opacity 250ms ease',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  collapseOpen: {
    gridTemplateRows: '1fr',
    opacity: 1,
  },
  collapseContent: {
    minHeight: 0,
    overflow: 'hidden',
  },
  collapseFields: {
    paddingTop: theme.spacing[4],
  },
  footer: {
    flexShrink: 0,
  },
});

export { ENCRYPTION_OPTIONS, MAILER_OPTIONS };
