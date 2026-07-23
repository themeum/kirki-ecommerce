import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import SwitchField from '@/components/form/switch-field';
import OptionAccordion from '@/components/option-accordion';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReplaceIcon, FlagIcon, WrenchIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { ApiConfigurationFormValues } from '@/schemas/forms/api-configuration-form';
import type { MultiCurrencySettingsFormValues } from '@/schemas/forms/multi-currency-settings-form';
import { useCurrencyExchangeProvidersQuery } from '@/services/currency';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import ApiConfigurationCard from '@/pages/settings/multi-currency-settings/api-config/api-configuration-card';
import ApiConfigurationPopup from '@/pages/settings/multi-currency-settings/api-config/api-configuration-dialog';

type ApiProvider = {
  id: string | number;
  name: string;
};

type ApiConfigData = {
  api_key?: string;
  update_frequency?: string;
  fallback_behaviour?: string;
  is_cache_enabled?: boolean;
  [key: string]: unknown;
};

const ApiConfig = () => {
  const { setValue } = useFormContext<MultiCurrencySettingsFormValues>();
  const formValues = useWatch<MultiCurrencySettingsFormValues>();
  const apiProvider = useWatch<MultiCurrencySettingsFormValues>({
    name: 'api_provider',
  });
  const apiConfig = useWatch<MultiCurrencySettingsFormValues>({
    name: 'api_config',
  });

  const [selectedAPI, setSelectedAPI] = useState('');
  const [apiConfigObj, setApiConfigObj] = useState<ApiConfigData>({});
  const [openPopup, setOpenPopup] = useState(false);

  const { data: providersData } = useCurrencyExchangeProvidersQuery();
  const apiProviderList = (providersData as ApiProvider[]) || [];

  useEffect(() => {
    setSelectedAPI(apiProvider != null ? String(apiProvider) : '');
  }, [apiProvider]);

  useEffect(() => {
    if (selectedAPI === apiProvider) {
      setApiConfigObj((apiConfig as ApiConfigData) || {});
    } else {
      setApiConfigObj({});
    }
  }, [selectedAPI, apiProvider, apiConfig]);

  const rightActions = () => (
    <ActionGroup gap={8} style={{ alignItems: 'center' }}>
      <SwitchField name="is_automatic_update_enabled" />
    </ActionGroup>
  );

  const hasAPIConfiguration = apiConfigObj?.api_key;

  const handlePopupSave = (values: ApiConfigurationFormValues) => {
    setValue('api_provider', selectedAPI, { shouldDirty: true });
    setValue('api_config', values, { shouldDirty: true });
  };

  return (
    <>
      <OptionAccordion
        header={__('Automatic Updates', 'kirki-ecommerce')}
        subHeader={__(
          'Configure automatic exchange rate providers for real-time currency conversion',
          'kirki-ecommerce',
        )}
        leftIcon={<ReplaceIcon />}
        rightActions={rightActions()}
      >
        <Flex direction="column" gap={8}>
          <Label htmlFor="api-provider-select">
            {__('Select API Provider', 'kirki-ecommerce')}
          </Label>
          <Select value={selectedAPI} onValueChange={setSelectedAPI}>
            <SelectTrigger id="api-provider-select">
              <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
            </SelectTrigger>
            <SelectContent>
              {apiProviderList?.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Flex>
        {selectedAPI &&
          (hasAPIConfiguration ? (
            <ApiConfigurationCard
              setOpenPopup={setOpenPopup}
              selectedAPI={selectedAPI}
              apiConfigObj={apiConfigObj}
              dataObj={(formValues || {}) as SettingsSectionData}
            />
          ) : (
            <Card type="inner">
              <Flex
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Flex direction={'column'} gap={8}>
                  <Text header={selectedAPI} leftIcon={<FlagIcon />} />
                  <Text
                    subHeader={__(
                      'Configure your API key and connection settings for ExchangeRate API',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
                <ActionGroup>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenPopup(true)}
                  >
                    <WrenchIcon />
                    {__('Configure', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </Card>
          ))}
      </OptionAccordion>
      <ApiConfigurationPopup
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        dataObj={apiConfigObj}
        onSave={handlePopupSave}
        selectedAPI={selectedAPI}
      />
    </>
  );
};

ApiConfig.displayName = 'ApiConfig';

export default ApiConfig;
