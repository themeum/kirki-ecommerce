import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import CheckboxField from '@/components/form/checkbox-field';
import PasswordField from '@/components/form/password-field';
import SelectField from '@/components/form/select-field';
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
import { Form } from '@/components/ui/form';
import { ConfigureKeyIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  ApiConfigurationFormSchema,
  apiConfigurationDefaultValues,
  type ApiConfigurationFormValues,
} from '@/schemas/forms/api-configuration-form';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ApiConfigData = {
  api_key?: string;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean;
  [key: string]: unknown;
};

type ApiConfigurationPopupProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSave?: (values: ApiConfigurationFormValues) => void;
  handleOnChange?: (value: unknown, key: string) => void;
  dataObj: ApiConfigData;
  selectedAPI: string;
};

const ApiConfigurationPopup = ({
  isOpen,
  onClose = () => {},
  onSave,
  handleOnChange,
  dataObj,
  selectedAPI,
}: ApiConfigurationPopupProps) => {
  const form = useForm<ApiConfigurationFormValues>({
    resolver: zodResolver(ApiConfigurationFormSchema),
    defaultValues: apiConfigurationDefaultValues,
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset(apiConfigurationDefaultValues);
      return;
    }

    const hasData = dataObj?.api_key;
    form.reset(
      hasData
        ? {
            api_key: dataObj.api_key || '',
            update_frequency:
              dataObj.update_frequency ||
              apiConfigurationDefaultValues.update_frequency,
            fallback_behaviour:
              dataObj.fallback_behaviour ||
              apiConfigurationDefaultValues.fallback_behaviour,
            is_cache_enabled: Boolean(dataObj.is_cache_enabled),
          }
        : apiConfigurationDefaultValues,
    );
  }, [selectedAPI, dataObj, isOpen, form]);

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

  const fallbackOptions = [
    {
      label: __('Use base currency only', 'kirki-ecommerce'),
      value: 'base_currency',
    },
    {
      label: __('Use last known rate', 'kirki-ecommerce'),
      value: 'last_known_rate',
    },
  ];

  const handleConfiguration = (values: ApiConfigurationFormValues) => {
    if (onSave) {
      onSave(values);
    } else if (handleOnChange) {
      handleOnChange(selectedAPI, 'api_provider');
      handleOnChange(values, 'api_config');
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
          <DialogTitle>
            {__('API Configuration', 'kirki-ecommerce')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleConfiguration)}>
            <DialogBody>
              <Flex direction="column" gap={16}>
                <PasswordField
                  name="api_key"
                  label={__('API Key', 'kirki-ecommerce')}
                  placeholder={'******'}
                />
                <Text weight="medium" css={styles.helperText}>{__(
                    'Your API key is encrypted and stored securely. Get your API key from ExchangeRate API',
                    'kirki-ecommerce',
                  )}</Text>
                <SelectField
                  name="update_frequency"
                  label={__('Update Frequency', 'kirki-ecommerce')}
                  options={updateFrequencyOptions}
                />
                <SelectField
                  name="fallback_behaviour"
                  label={__('Fallback Behavior', 'kirki-ecommerce')}
                  options={fallbackOptions}
                />
                <CheckboxField
                  name="is_cache_enabled"
                  label={__(
                    'Cache exchange rates to reduce API calls',
                    'kirki-ecommerce',
                  )}
                />
              </Flex>
            </DialogBody>
            <DialogFooter style={{ justifyContent: 'space-between' }}>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  form.reset(apiConfigurationDefaultValues);
                }}
              >
                {__('Remove', 'kirki-ecommerce')}
              </Button>
              <ActionGroup gap={12}>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    css={styles.cancelButton}
                  >
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

const styles = {
  cancelButton: scoped({
    boxShadow: theme.shadow.sm,
  }),
  helperText: scoped({
    ...theme.typography.paragraph(),
  }),
};
