import { RefreshCcw, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import OptionAccordion from '@/components/option-accordion';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { getProviderConfig } from '@/features/settings/multi-currency/lib/currency-list';
import ApiConfigurationCard from '@/features/settings/multi-currency/pages/api-config/api-configuration-card';
import ApiConfigurationPopup from '@/features/settings/multi-currency/pages/api-config/api-configuration-dialog';
import ProviderLogo from '@/features/settings/multi-currency/pages/api-config/provider-logo';
import type { ApiConfigurationFormPayload } from '@/features/settings/multi-currency/schemas/forms/api-configuration-form';
import type { MultiCurrencySettingsFormInput } from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import { useCurrencyExchangeProvidersQuery } from '@/features/settings/multi-currency/services/currency';
import type { CurrencySettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const ApiConfig = ({ currencySettings }: { currencySettings?: CurrencySettings | null }) => {
  const { setValue, control } = useFormContext<MultiCurrencySettingsFormInput>();
  const apiProvider = useWatch({
    control,
    name: 'api_provider',
  });
  const apiConfigs = useWatch({
    control,
    name: 'api_configs',
  });
  const isAutomaticUpdateEnabled = useWatch({
    control,
    name: 'is_automatic_update_enabled',
  });

  const [openPopup, setOpenPopup] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: providersData } = useCurrencyExchangeProvidersQuery();
  const apiProviderList = useMemo(() => {
    if (!isDefined(providersData)) {
      return [];
    }

    return providersData;
  }, [providersData]);

  const selectedProvider = useMemo(() => {
    if (!isDefined(apiProvider)) {
      return undefined;
    }

    return apiProviderList.find((item) => item.id === apiProvider);
  }, [apiProvider, apiProviderList]);

  const providerName = selectedProvider?.name || '';

  const isApiProviderSelected = isDefined(apiProvider) && apiProvider;
  const hasAPIConfiguration = Boolean(getProviderConfig(apiConfigs, apiProvider)?.api_key);

  const handleProviderChange = (providerId: string | null) => {
    setValue('api_provider', providerId, { shouldDirty: true });
  };

  const handlePopupSave = (values: ApiConfigurationFormPayload) => {
    if (!apiProvider) {
      return;
    }

    setValue('api_configs', { ...apiConfigs, [apiProvider]: values }, { shouldDirty: true });
  };

  const handleAutomaticUpdateChange = (checked: boolean) => {
    setValue('is_automatic_update_enabled', checked, { shouldDirty: true });
    setIsCollapsed(false);
  };

  return (
    <div>
      <OptionAccordion
        header={
          <Flex gap={2} align="center">
            {__('Automatic Updates', 'kirki-ecommerce')}
          </Flex>
        }
        subHeader={__(
          'Configure automatic exchange rate providers for real-time currency conversion',
          'kirki-ecommerce',
        )}
        leftIcon={<RefreshCcw size={20} color={theme.colors.icon.secondary} />}
        rightActions={
          <Switch
            checked={Boolean(isAutomaticUpdateEnabled)}
            onCheckedChange={handleAutomaticUpdateChange}
            aria-label={__('Automatic updates', 'kirki-ecommerce')}
          />
        }
        expandable={Boolean(isAutomaticUpdateEnabled)}
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
        cssOverride={{
          backgroundColor: theme.colors.background.surface,
          '& [data-option-accordion-card="true"]': {
            backgroundColor: theme.colors.background.surfaceAlt,
            border: 'none',
            borderTop: `1px solid ${theme.colors.border.default}`,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },
        }}
      >
        <Flex direction="column" gap={2}>
          <Flex direction="column" gap={2}>
            <Label htmlFor="api-provider-select">
              {__('Select API Provider', 'kirki-ecommerce')}
            </Label>
            <Select value={apiProvider ?? undefined} onValueChange={handleProviderChange}>
              <SelectTrigger
                id="api-provider-select"
                showClear={Boolean(isApiProviderSelected)}
                onClear={isApiProviderSelected ? () => handleProviderChange(null) : undefined}
              >
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
          {isApiProviderSelected && (
            <Flex direction="column" gap="4">
              {hasAPIConfiguration ? (
                <ApiConfigurationCard
                  setOpenPopup={setOpenPopup}
                  providerName={providerName}
                  providerIcon={selectedProvider?.icon}
                  currencySettings={currencySettings}
                />
              ) : (
                <Card
                  data-search-id="currency.api-configuration"
                  data-search-keywords="api key, conversion rate, exchange rate provider, automatic rates"
                  data-search-title={__('Exchange Rate API Configuration', 'kirki-ecommerce')}
                  noShadow
                >
                  <CardContent cssOverride={cardStyles.innerContent}>
                    <Flex justify="space-between" align="center">
                      <Flex direction="column" gap={2}>
                        <Flex gap={2} align="center">
                          <ProviderLogo icon={selectedProvider?.icon} />
                          <Text>{providerName}</Text>
                        </Flex>
                        <Text variant="small" color="secondary">
                          {__(
                            'API key and connection details used to fetch live conversion rates.',
                            'kirki-ecommerce',
                          )}
                        </Text>
                      </Flex>
                      <ActionGroup>
                        <Button variant="secondary" onClick={() => setOpenPopup(true)}>
                          <Wrench size={16} />
                          {__('Configure', 'kirki-ecommerce')}
                        </Button>
                      </ActionGroup>
                    </Flex>
                  </CardContent>
                </Card>
              )}
            </Flex>
          )}
        </Flex>
      </OptionAccordion>
      {isApiProviderSelected && (
        <ApiConfigurationPopup
          isOpen={openPopup}
          onClose={() => setOpenPopup(false)}
          onSave={handlePopupSave}
          providerName={providerName}
        />
      )}
    </div>
  );
};

ApiConfig.displayName = 'ApiConfig';

export default ApiConfig;
