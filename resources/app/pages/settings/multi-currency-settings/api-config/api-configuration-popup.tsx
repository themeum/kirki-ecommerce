import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import CheckboxField from '@/components/form/checkbox-field';
import PasswordField from '@/components/form/password-field';
import SelectField from '@/components/form/select-field';
import { Form } from '@/components/ui/form';
import { ConfigureKeyIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import {
  Popover,
  PopoverBody,
  PopoverHeader,
} from '@/molecules/popover';
import Text from '@/molecules/text';
import {
  ApiConfigurationFormSchema,
  apiConfigurationDefaultValues,
  type ApiConfigurationFormValues,
} from '@/schemas/forms/api-configuration-form';
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
    <>
      <Popover isOpen={isOpen}>
        <PopoverHeader onClose={onClose}>
          {__('API Configuration', 'kirki-ecommerce')}
        </PopoverHeader>
        <Form {...form}>
          <PopoverBody
            style={{
              padding: '20px',
              borderTop: '1px solid #E4E3E9',
              borderBottom: '1px solid #E4E3E9',
            }}
          >
            <Flex direction="column" gap={16}>
              <PasswordField
                name="api_key"
                label={__('API Key', 'kirki-ecommerce')}
                placeholder={'******'}
              />
              <Text
                type={'secondary'}
                style={{ fontWeight: 400 }}
                header={__(
                  'Your API key is encrypted and stored securely. Get your API key from ExchangeRate API',
                  'kirki-ecommerce',
                )}
              />
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
          </PopoverBody>
          <Flex style={{ padding: '12px 20px' }}>
            <Button
              type={'destructiveSoft'}
              text={__('Remove', 'kirki-ecommerce')}
              onClick={() => {
                form.reset(apiConfigurationDefaultValues);
              }}
            />
            <ActionGroup gap={12}>
              <Button
                text={__('Cancel', 'kirki-ecommerce')}
                type={'ghost'}
                onClick={onClose}
                style={{ boxShadow: '0 1px 1px 0 rgba(86, 65, 243, 0.3)' }}
              />
              <Button
                leftIcon={<ConfigureKeyIcon />}
                text={__('Configure', 'kirki-ecommerce')}
                onClick={form.handleSubmit(handleConfiguration)}
                type={'primary'}
              />
            </ActionGroup>
          </Flex>
        </Form>
      </Popover>
    </>
  );
};

ApiConfigurationPopup.displayName = 'ApiConfigurationPopup';

export default ApiConfigurationPopup;
