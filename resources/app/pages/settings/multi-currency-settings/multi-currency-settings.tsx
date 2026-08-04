import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CurrencyIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import {
  MultiCurrencySettingsFormSchema,
  type MultiCurrencySettingsFormInput,
  type MultiCurrencySettingsFormPayload,
} from '@/schemas/forms/multi-currency-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import ApiConfig from '@/pages/settings/multi-currency-settings/api-config/api-config';
import { AvailableCurrencyList } from '@/pages/settings/multi-currency-settings/available-currency-list';
import CurrencyFormatSettings from '@/pages/settings/multi-currency-settings/currency-format-settings';

const MultiCurrencySettings = () => {
  const { data: currencySettingsData, isLoading } = useSettingsQuery('currency');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'currency'>();

  const form = useForm<MultiCurrencySettingsFormInput, unknown, MultiCurrencySettingsFormPayload>({
    resolver: zodResolver(MultiCurrencySettingsFormSchema),
    defaultValues: getDefaults(MultiCurrencySettingsFormSchema),
  });

  const { isDirty } = form.formState;
  const loaded = !isLoading && Boolean(currencySettingsData);

  useEffect(() => {
    if (!currencySettingsData || !Object.keys(currencySettingsData).length) {
      return;
    }

    const apiConfigData =
      (currencySettingsData.api_config as Record<string, unknown> | null) || {};

    form.reset(
      pickFormValues(MultiCurrencySettingsFormSchema, currencySettingsData, {
        api_config: {
          api_key:
            typeof apiConfigData.api_key === 'string' ? apiConfigData.api_key : '',
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

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

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

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<CurrencyIcon />}
              title={__('Currency', 'kirki-ecommerce')}
            />

            <Card cssOverride={cardStyles.largeCard} >
              <CardContent cssOverride={cardStyles.largeContentPadded}>

              <Flex direction="column" gap={2}>
                <Text weight="semibold">{__('Currency Management', 'kirki-ecommerce')}</Text>
                <Text color="secondary">{__(
              'Manage product pricing across multiple currencies with manual or automatic conversion rates.',
              'kirki-ecommerce',
              )}</Text>
              </Flex>
              <AvailableCurrencyList />
              <ApiConfig />
              </CardContent>
            </Card>
            <Card cssOverride={cardStyles.largeCard} >
              <CardContent cssOverride={cardStyles.largeContentPadded}>

              <Flex direction="column" gap={2}>
                <Text weight="semibold">{__('Currency Preferences', 'kirki-ecommerce')}</Text>
                <Text color="secondary">{__(
              'Set your preferences for how currency is displayed.',
              'kirki-ecommerce',
              )}</Text>
              </Flex>
              <CurrencyFormatSettings />
              </CardContent>
            </Card>
          </Flex>
        </Form>
      ) : (
        <div>{__('Loading ...', 'kirki-ecommerce')}</div>
      )}
    </Container>
  );
};

MultiCurrencySettings.displayName = 'MultiCurrencySettings';

export default MultiCurrencySettings;
