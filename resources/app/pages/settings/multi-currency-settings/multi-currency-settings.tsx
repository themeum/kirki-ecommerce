import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { CurrencyIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Text from '@/molecules/text';
import { getErrorsObject } from '@/libs/api';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type {
  ConfirmationVariant,
  FormErrors,
  SettingsSectionData,
} from '@/types';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';
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
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const hasUnsavedData = useUnsavedStatus();
  const [dataObj, setDataObj] = useState<SettingsSectionData>({});
  const [initialData, setInitialData] = useState<SettingsSectionData>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const loaded = !isLoading && Boolean(currencySettingsData);

  const handleOnChange = (value: unknown, key: string) => {
    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      ['data.' + key]: null,
    }));
  };

  useEffect(() => {
    if (!currencySettingsData) {
      return;
    }

    setDataObj(currencySettingsData);
    setInitialData(currencySettingsData);
  }, [currencySettingsData]);

  const handleSaveData = () => {
    const updatedObj: SettingsSectionData = {
      ...dataObj,
      is_automatic_update_enabled:
        dataObj?.is_automatic_update_enabled || false,
    };
    saveSettings(
      { key: 'currency', data: updatedObj },
      {
        onSuccess: () => setUnsavedDataStatus(false),
        onError: (error) => {
          const errObj = error as { errors?: Record<string, string[]> };
          setErrors(getErrorsObject(errObj.errors));
        },
      },
    );
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
    setErrors({});
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
      },
    });
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
                type="ghost"
                text={__('Cancel', 'kirki-ecommerce')}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                size="small"
                onClick={handleSaveData}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              textIcon={<CurrencyIcon />}
              text={__('Currency', 'kirki-ecommerce')}
              handleBack={handleBackButton}
            />

            <Card type={'large'}>
              <Text
                header={__('Currency Management', 'kirki-ecommerce')}
                subHeader={__(
                  'Manage product pricing across multiple currencies with manual or automatic conversion rates.',
                  'kirki-ecommerce',
                )}
                type="primary"
                style={{ gap: 'var(--decom-spacing-f3)' }}
              />
              <AvailableCurrencyList dataObj={dataObj} />
              <ApiConfig
                dataObj={dataObj}
                handleOnChange={handleOnChange}
                errors={errors}
              />
            </Card>
            <Card type={'large'}>
              <Text
                header={__('Currency Preferences', 'kirki-ecommerce')}
                subHeader={__(
                  'Set your preferences for how currency is displayed.',
                  'kirki-ecommerce',
                )}
                type="primary"
                style={{ gap: '12px' }}
              />
              <CurrencyFormatSettings
                dataObj={dataObj}
                handleOnChange={handleOnChange}
                errors={errors}
              />
            </Card>
          </Flex>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

MultiCurrencySettings.displayName = 'MultiCurrencySettings';

export default MultiCurrencySettings;
