import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import ApiConfig from '@/features/settings/multi-currency/pages/api-config/api-config';
import { AvailableCurrencyList } from '@/features/settings/multi-currency/pages/available-currency-list';
import CurrencyFormatSettings from '@/features/settings/multi-currency/pages/currency-format-settings';
import {
  type MultiCurrencySettingsFormInput,
  type MultiCurrencySettingsFormPayload,
  MultiCurrencySettingsFormSchema,
} from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import MultiCurrencySettingsSkeleton from '@/features/settings/multi-currency/skeletons/multi-currency-settings-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { CurrencyIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const MultiCurrencySettings = () => {
  const { data: currencySettingsData, isLoading } = useSettingsQuery('currency');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'currency'>();

  const form = useForm<MultiCurrencySettingsFormInput, unknown, MultiCurrencySettingsFormPayload>({
    resolver: zodResolver(MultiCurrencySettingsFormSchema),
    defaultValues: getDefaults(MultiCurrencySettingsFormSchema),
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!currencySettingsData || !Object.keys(currencySettingsData).length) {
      return;
    }

    const apiConfigData = (currencySettingsData.api_config as Record<string, unknown> | null) ?? {};

    form.reset(
      pickFormValues(MultiCurrencySettingsFormSchema, currencySettingsData, {
        api_config: {
          api_key: typeof apiConfigData.api_key === 'string' ? apiConfigData.api_key : '',
          update_frequency:
            typeof apiConfigData.update_frequency === 'string'
              ? apiConfigData.update_frequency
              : 'every_1_hour',
          fallback_behaviour:
            typeof apiConfigData.fallback_behaviour === 'string'
              ? apiConfigData.fallback_behaviour
              : 'last_known_rate',
          is_cache_enabled: Boolean(apiConfigData.is_cache_enabled),
        },
      }),
    );
  }, [currencySettingsData, form]);

  const handleSaveData = async (payload: MultiCurrencySettingsFormPayload) => {
    try {
      await saveSettings({ key: 'currency', data: payload });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit(handleSaveData),
    onDiscard: handleDiscardData,
  });

  return !isLoading ? (
    <Container size="sm">
      <Form {...form}>
        <Flex direction="column" gap={4}>
          <SettingsPageHeader icon={<CurrencyIcon />} title={__('Currency', 'kirki-ecommerce')} />

          <Card data-search-id="currency.management" data-search-keywords="multi currency, exchange rate, conversion" cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={{ paddingBottom: theme.spacing[4] }}>
              <Flex direction="column" gap={2} cssOverride={{ marginTop: theme.spacing[5] }}>
                <Flex direction="column" gap={2}>
                  <Text weight="semibold">{__('Currency Management', 'kirki-ecommerce')}</Text>
                  <Text variant="small" color="secondary">
                    {__(
                      'Manage product pricing across multiple currencies with manual or automatic conversion rates.',
                      'kirki-ecommerce',
                    )}
                  </Text>
                </Flex>
                <AvailableCurrencyList />
                <ApiConfig />
              </Flex>
            </CardContent>
          </Card>
          <Card data-search-id="currency.preferences" data-search-keywords="symbol, rounding, price display" cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={2}>
                <Text weight="semibold">{__('Currency Preferences', 'kirki-ecommerce')}</Text>
                <Text color="secondary">
                  {__(
                    'Symbol placement, decimals and separators used wherever prices are shown.',
                    'kirki-ecommerce',
                  )}
                </Text>
              </Flex>
              <CurrencyFormatSettings />
            </CardContent>
          </Card>
        </Flex>
      </Form>
    </Container>
  ) : (
    <MultiCurrencySettingsSkeleton />
  );
};

MultiCurrencySettings.displayName = 'MultiCurrencySettings';

export default MultiCurrencySettings;
