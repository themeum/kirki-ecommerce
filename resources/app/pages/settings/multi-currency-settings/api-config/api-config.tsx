import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import SwitchField from '@/components/form/switch-field';
import OptionAccordion from '@/components/option-accordion';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { WrenchIcon } from '@/icons';
import type { CurrencySettings } from '@/schemas/catalog/settings';
import type { ApiConfigurationFormPayload } from '@/schemas/forms/api-configuration-form';
import type { MultiCurrencySettingsFormInput } from '@/schemas/forms/multi-currency-settings-form';
import { useCurrencyExchangeProvidersQuery } from '@/services/currency';
import { __ } from '@/wpi18n';

import { cardStyles } from '@/theme/card-styles';

import Badge from '@/components/ui/badge';
import ApiConfigurationCard from '@/pages/settings/multi-currency-settings/api-config/api-configuration-card';
import ApiConfigurationPopup from '@/pages/settings/multi-currency-settings/api-config/api-configuration-dialog';
import { theme } from '@/theme';
import { mergeCss } from '@/theme/mixins';
import { Flag, RefreshCcw } from 'lucide-react';

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
  const { setValue } = useFormContext<MultiCurrencySettingsFormInput>();
  const formValues = useWatch<MultiCurrencySettingsFormInput>();
  const apiProvider = useWatch<MultiCurrencySettingsFormInput>({
    name: 'api_provider',
  });
  const apiConfig = useWatch<MultiCurrencySettingsFormInput>({
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
    <ActionGroup gap={2}>
      <SwitchField name="is_automatic_update_enabled" disabled />
    </ActionGroup>
  );

  const hasAPIConfiguration = apiConfigObj?.api_key;

  const handlePopupSave = (values: ApiConfigurationFormPayload) => {
    setValue('api_provider', selectedAPI, { shouldDirty: true });
    setValue('api_config', values, { shouldDirty: true });
  };

  return (
    <div>
      <OptionAccordion
        header={<Flex gap={2} align="center">
          {__('Automatic Updates', 'kirki-ecommerce')}
          <Badge>Work in progress</Badge>
        </Flex>}
        subHeader={__(
          'Configure automatic exchange rate providers for real-time currency conversion',
          'kirki-ecommerce',
        )}
        leftIcon={<RefreshCcw size={16} />}
        rightActions={rightActions()}
        disabled
      >
        <Flex direction="column" gap={2}>
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
        {selectedAPI && hasAPIConfiguration ? (
          <ApiConfigurationCard
            setOpenPopup={setOpenPopup}
            selectedAPI={selectedAPI}
            apiConfigObj={apiConfigObj}
            dataObj={(formValues || {}) as CurrencySettings}
          />
        ) : (
          <Card cssOverride={mergeCss(cardStyles.innerCard, { marginTop: theme.spacing[2] })} >
            <CardContent cssOverride={cardStyles.innerContent}>
              <Flex justify="space-between" align="center">
                <Flex direction={'column'} gap={2}>
                  {selectedAPI && (
                    <Flex gap={2} align="center">
                      <Flag size={16} />
                      <Text>{selectedAPI}</Text>
                    </Flex>
                  )}
                  <Text variant="small" color="secondary">{__(
                    'Configure your API key and connection settings for ExchangeRate API',
                    'kirki-ecommerce',
                  )}</Text>
                </Flex>
                <ActionGroup>
                  <Button
                    variant="outline"
                    onClick={() => setOpenPopup(true)}
                  >
                    <WrenchIcon />
                    {__('Configure', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
        )}
      </OptionAccordion>
      <ApiConfigurationPopup
        isOpen={openPopup}
        onClose={() => setOpenPopup(false)}
        dataObj={apiConfigObj}
        onSave={handlePopupSave}
        selectedAPI={selectedAPI}
      />
    </div>
  );
};

ApiConfig.displayName = 'ApiConfig';

export default ApiConfig;
