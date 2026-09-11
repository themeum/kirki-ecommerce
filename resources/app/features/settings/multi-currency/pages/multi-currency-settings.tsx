import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import { toCurrencyDraft } from '@/features/settings/multi-currency/lib/currency-list';
import AddCurrencyPopup from '@/features/settings/multi-currency/pages/add-currency-dialog';
import ApiConfig from '@/features/settings/multi-currency/pages/api-config/api-config';
import { AvailableCurrencyList } from '@/features/settings/multi-currency/pages/available-currency-list';
import CurrencyFormatSettings from '@/features/settings/multi-currency/pages/currency-format-settings';
import type { CurrencyDraft } from '@/features/settings/multi-currency/schemas/catalog/currency';
import {
  type MultiCurrencySettingsFormInput,
  type MultiCurrencySettingsFormPayload,
  MultiCurrencySettingsFormSchema,
} from '@/features/settings/multi-currency/schemas/forms/multi-currency-settings-form';
import {
  useAvailableCurrenciesQuery,
  useUpdateCurrencyMutation,
} from '@/features/settings/multi-currency/services/currency';
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
  const { data: rawCurrencies = [] } = useAvailableCurrenciesQuery();
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'currency'>();
  const { mutateAsync: updateCurrencies } = useUpdateCurrencyMutation();

  const form = useForm<MultiCurrencySettingsFormInput, unknown, MultiCurrencySettingsFormPayload>({
    resolver: zodResolver(MultiCurrencySettingsFormSchema),
    defaultValues: getDefaults(MultiCurrencySettingsFormSchema),
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (
      !currencySettingsData ||
      !Object.keys(currencySettingsData).length ||
      !rawCurrencies.length
    ) {
      return;
    }

    form.reset(
      pickFormValues(MultiCurrencySettingsFormSchema, currencySettingsData, {
        currencies: rawCurrencies.map(toCurrencyDraft),
      }),
    );
  }, [currencySettingsData, rawCurrencies, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveData = async (payload: MultiCurrencySettingsFormPayload) => {
    try {
      const editedCurrencies = form.getValues('currencies') ?? [];
      const changedItems = editedCurrencies.flatMap<CurrencyDraft>((currency) => {
        const original = rawCurrencies.find((row) => row.id === currency.id);
        if (!original) {
          return [];
        }

        const rateChanged = String(original.exchange_rate) !== String(currency.exchange_rate);
        const activeChanged = Boolean(original.is_active) !== Boolean(currency.is_active);

        if (!rateChanged && !activeChanged) {
          return [];
        }

        return [
          toCurrencyDraft({
            ...original,
            exchange_rate: currency.exchange_rate,
            is_active: currency.is_active,
          }),
        ];
      });

      await Promise.all([
        saveSettings({ key: 'currency', data: payload }),
        changedItems.length ? updateCurrencies({ items: changedItems }) : Promise.resolve(),
      ]);

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

          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={{ paddingBottom: theme.spacing[4] }}>
              <Flex direction="column" gap={3}>
                <Flex
                  justify="space-between"
                  cssOverride={{ marginTop: theme.spacing[3], marginBottom: theme.spacing[3] }}
                >
                  <Flex direction="column" gap={2}>
                    <Text weight="semibold">{__('Currency Management', 'kirki-ecommerce')}</Text>
                    <Text variant="small" color="secondary">
                      {__(
                        'Manage product pricing across multiple currencies with manual or automatic conversion rates.',
                        'kirki-ecommerce',
                      )}
                    </Text>
                  </Flex>
                  <AddCurrencyPopup />
                </Flex>
                <AvailableCurrencyList />
                <ApiConfig currencySettings={currencySettingsData} />
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={2}>
                <Text weight="semibold">{__('Currency Preferences', 'kirki-ecommerce')}</Text>
                <Text color="secondary">
                  {__('Set your preferences for how currency is displayed.', 'kirki-ecommerce')}
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
