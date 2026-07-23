import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { CurrencyIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import {
  MultiCurrencySettingsFormSchema,
  multiCurrencySettingsDefaultValues,
  type MultiCurrencySettingsFormValues,
} from '@/schemas/forms/multi-currency-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { ConfirmationVariant, SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import ApiConfig from '@/pages/settings/multi-currency-settings/api-config/api-config';
import { AvailableCurrencyList } from '@/pages/settings/multi-currency-settings/available-currency-list';
import CurrencyFormatSettings from '@/pages/settings/multi-currency-settings/currency-format-settings';

type SettingsOutletContext = {
  confirmAction: (params: {
    action?: () => void;
    otherProps?: {
      variant?: ConfirmationVariant;
      force?: boolean;
      title?: string;
      subtitle?: string;
    };
  }) => void;
};

const MultiCurrencySettings = () => {
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const { data: currencySettingsData, isLoading } = useSettingsQuery('currency');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation();

  const hasUnsavedData = useUnsavedStatus();
  const form = useForm<MultiCurrencySettingsFormValues>({
    resolver: zodResolver(MultiCurrencySettingsFormSchema),
    defaultValues: multiCurrencySettingsDefaultValues,
  });

  const { isDirty } = form.formState;
  const loaded = !isLoading && Boolean(currencySettingsData);

  useEffect(() => {
    if (!currencySettingsData || !Object.keys(currencySettingsData).length) {
      return;
    }

    const apiConfigData =
      (currencySettingsData.api_config as Record<string, unknown> | null) || {};

    form.reset({
      ...multiCurrencySettingsDefaultValues,
      ...currencySettingsData,
      is_automatic_update_enabled:
        currencySettingsData.is_automatic_update_enabled || false,
      api_config: {
        ...multiCurrencySettingsDefaultValues.api_config,
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
    });
  }, [currencySettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveData = async (values: MultiCurrencySettingsFormValues) => {
    const updatedObj = {
      ...values,
      is_automatic_update_enabled: values?.is_automatic_update_enabled || false,
    } as SettingsSectionData;

    try {
      await saveSettings({ key: 'currency', data: updatedObj });
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  const handleBackButton = () => {
    if (isDirty) {
      confirmAction({
        action: () => navigate(`/settings`),
      });
      return;
    }
    navigate(`/settings`);
  };

  return (
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscardData}
                disabled={isSaving}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={form.handleSubmit(handleSaveData)}
                loading={isSaving}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={16}>
              <PageNavbar
                textIcon={<CurrencyIcon />}
                text={__('Currency', 'kirki-ecommerce')}
                handleBack={handleBackButton}
              />

              <Card css={styles.largeCard} >
                <CardContent css={styles.largeContent}>

                <Text
                header={__('Currency Management', 'kirki-ecommerce')}
                subHeader={__(
                'Manage product pricing across multiple currencies with manual or automatic conversion rates.',
                'kirki-ecommerce',
                )}
                type="primary"
                style={{ gap: theme.spacing.base }}
                />
                <AvailableCurrencyList />
                <ApiConfig />
                </CardContent>
              </Card>
              <Card css={styles.largeCard} >
                <CardContent css={styles.largeContent}>

                <Text
                header={__('Currency Preferences', 'kirki-ecommerce')}
                subHeader={__(
                'Set your preferences for how currency is displayed.',
                'kirki-ecommerce',
                )}
                type="primary"
                style={{ gap: '12px' }}
                />
                <CurrencyFormatSettings />
                </CardContent>
              </Card>
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

MultiCurrencySettings.displayName = 'MultiCurrencySettings';

const styles = {
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  largeCard: scoped({ gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({ padding: theme.spacing['3xl'] }),
  innerCard: scoped({ borderRadius: theme.radius.lg, boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({ padding: theme.spacing.lg }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  innerDarkContent: scoped({ padding: theme.spacing.lg }),
  darkCard: scoped({ backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({ borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
};

export default MultiCurrencySettings;
