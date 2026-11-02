import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';

import PasswordField from '@/components/form/password-field';
import SelectField from '@/components/form/select-field';
import ActionGroup from '@/components/ui/action-group';
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
import { getProviderConfig } from '@/features/settings/multi-currency/lib/currency-list';
import {
  type ApiConfigurationFormInput,
  type ApiConfigurationFormPayload,
  ApiConfigurationFormSchema,
} from '@/features/settings/multi-currency/schemas/forms/api-configuration-form';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { ConfigureKeyIcon } from '@/icons/common';
import { getDefaults } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

const apiConfigurationDefaultValues = getDefaults(ApiConfigurationFormSchema);

type ApiConfigurationPopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (values: ApiConfigurationFormPayload) => void;
  providerName: string;
};

const ApiConfigurationPopup = ({
  isOpen,
  onClose = noop,
  onSave,
  providerName,
}: ApiConfigurationPopupProps) => {
  const form = useForm<ApiConfigurationFormInput, unknown, ApiConfigurationFormPayload>({
    resolver: zodResolver(ApiConfigurationFormSchema),
    defaultValues: apiConfigurationDefaultValues,
  });

  const { control } = useFormContext<MultiCurrencySettingsFormInput>();
  const [apiProvider, apiConfigs] = useWatch({
    control,
    name: ['api_provider', 'api_configs'],
  });
  const apiConfig = getProviderConfig(apiConfigs, apiProvider);

  useEffect(() => {
    if (!isOpen) {
      form.reset(apiConfigurationDefaultValues);
      return;
    }

    form.reset(
      isDefined(apiConfig)
        ? {
            api_key: apiConfig.api_key,
            update_frequency: apiConfig.update_frequency,
          }
        : apiConfigurationDefaultValues,
    );
  }, [apiConfig, isOpen, form]);

  const updateFrequencyOptions = [
    { label: __('Every 15 minutes', 'kirki-ecommerce'), value: 'every_15_min' },
    { label: __('Every 30 minutes', 'kirki-ecommerce'), value: 'every_30_min' },
    { label: __('Every hour', 'kirki-ecommerce'), value: 'every_1_hour' },
    { label: __('Every 6 hours', 'kirki-ecommerce'), value: 'every_6_hours' },
    {
      label: __('Every 12 hours', 'kirki-ecommerce'),
      value: 'every_12_hours',
    },
    {
      label: __('Daily (24 hours)', 'kirki-ecommerce'),
      value: 'daily_24_hours',
    },
  ];

  const handleConfiguration = (values: ApiConfigurationFormPayload) => {
    if (onSave) {
      onSave(values);
    }

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
        <DialogHeader>
          <DialogTitle>{__('API Configuration', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleConfiguration)}>
            <DialogBody>
              <Flex direction="column" gap={4}>
                <PasswordField
                  name="api_key"
                  label={__('API Key', 'kirki-ecommerce')}
                  placeholder="******"
                  description={
                    /* translators: %s: provider name */
                    sprintf(
                      __(
                        'Your API key is stored securely. Get your API key from %s',
                        'kirki-ecommerce',
                      ),
                      providerName,
                    )
                  }
                />
                <SelectField
                  name="update_frequency"
                  label={__('Update Frequency', 'kirki-ecommerce')}
                  options={updateFrequencyOptions}
                />
              </Flex>
            </DialogBody>
            <DialogFooter style={{ justifyContent: 'space-between' }}>
              <ActionGroup gap={3}>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" cssOverride={styles.cancelButton}>
                    {__('Cancel', 'kirki-ecommerce')}
                  </Button>
                </DialogClose>
                <Button type="submit" variant="primary">
                  <ConfigureKeyIcon />
                  {__('Configure', 'kirki-ecommerce')}
                </Button>
              </ActionGroup>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ApiConfigurationPopup.displayName = 'ApiConfigurationPopup';

export default ApiConfigurationPopup;

const styles = defineStyles({
  cancelButton: {
    boxShadow: theme.shadow.sm,
  },
});
