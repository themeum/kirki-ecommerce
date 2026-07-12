import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';

import PageNavbar from '@/components/page-navbar';
import { TaxIcon } from '@/icons';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { RadioGroup } from '@/molecules/radio-group';
import Separator from '@/molecules/separator';
import Text from '@/molecules/text';
import { dispatchToastMessage } from '@/pages/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from '@/store/settingsSlice';
import { getErrorsObject } from '@/store/utils';
import type { FormErrors, SettingsSectionData } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '../utils';
import type { TaxRegion } from './utils';
import TaxProfile from './tax-profile/tax-profile';
import TaxRegions from './tax-region/tax-region';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type TaxSettingsFormData = Omit<SettingsSectionData, 'tax_regions'> & {
  is_tax_inclusive_price?: boolean;
  is_enabled_taxed_price?: boolean;
  is_shipping_tax_enabled?: boolean;
  tax_regions?: TaxRegion[];
  tax_services?: unknown[];
  tax_ids?: unknown[];
};

const TaxSettings = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [isTaxInclusivePrice, setIsTaxInclusivePrice] = useState(false);
  const [enableShippingTax, setEnableShippingTax] = useState(false);
  const [enableTaxPrice, setEnableTaxPrice] = useState(false);
  const [taxSettingsData, setTaxSettingsData] = useState<TaxSettingsFormData>(
    {},
  );
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const hasUnsavedData = useAppSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: taxSettings } = useAppSelector(
    (state) => state.settings?.tax,
  );

  useEffect(() => {
    if (!loaded) {
      dispatch(getSettingsAPI('tax'));
    }
  }, []);

  useEffect(() => {
    if (!taxSettings || !Object.keys(taxSettings).length) {
      return;
    }
    setInitialData();
  }, [taxSettings]);

  const optionsArray = [
    {
      title: __(
        'Tax should be calculated & displayed in the checkout page',
        'kirki-ecommerce',
      ),
      value: 'not_inclusive',
    },
    {
      title: __(
        'Tax is already included in product price and shipping rate',
        'kirki-ecommerce',
      ),
      value: 'inclusive',
    },
  ];

  const handleTaxCollection = (value: string | number, _unused?: string) => {
    if (!value) {
      return;
    }
    setUnsavedDataStatus(true);
    if (value === 'inclusive') {
      setIsTaxInclusivePrice(true);
    } else {
      setIsTaxInclusivePrice(false);
    }
  };

  const handleSaveTaxSettings = async (updatedRegions?: TaxRegion[]) => {
    const data: TaxSettingsFormData = {
      ...taxSettingsData,
      is_tax_inclusive_price: isTaxInclusivePrice,
      is_enabled_taxed_price: enableTaxPrice,
      is_shipping_tax_enabled: enableShippingTax,
      tax_regions: updatedRegions ?? taxRegions,
      tax_services: [],
      tax_ids: [],
    };

    const result = await updateSettingsAPI('tax', data);

    if (isApiSuccess(result)) {
      dispatch(updateSettings({ key: 'tax', value: result.data as SettingsSectionData }));
      setUnsavedDataStatus(false);
      dispatchToastMessage('success', {
        title: __('Tax settings updated', 'kirki-ecommerce'),
      });
    } else {
      const errorResult = result as { errors?: Record<string, string[]> };
      setErrors(getErrorsObject(errorResult.errors));
    }
  };

  const handleDiscardData = () => {
    setInitialData();
    setUnsavedDataStatus(false);
  };

  const setInitialData = () => {
    if (!taxSettings) {
      return;
    }
    setTaxSettingsData(taxSettings as TaxSettingsFormData);
    setIsTaxInclusivePrice(!!taxSettings.is_tax_inclusive_price);
    setTaxRegions(
      Array.isArray(taxSettings.tax_regions)
        ? (taxSettings.tax_regions as TaxRegion[])
        : [],
    );
    setEnableShippingTax(!!taxSettings.is_shipping_tax_enabled);
    setEnableTaxPrice(!!taxSettings.is_enabled_taxed_price);
  };

  const handleBackButton = () => {
    const updatedData = {
      ...taxSettingsData,
      is_tax_inclusive_price: isTaxInclusivePrice,
      is_enabled_taxed_price: enableTaxPrice,
      is_shipping_tax_enabled: enableShippingTax,
    };
    checkUnsavedDataStatus({
      initialDataObj: taxSettings,
      updatedDataObj: updatedData,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate('/settings'),
        }),
      onClean: () => navigate('/settings'),
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
                onClick={handleDiscardData}
                size="small"
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                onClick={handleSaveTaxSettings}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<TaxIcon />}
            text={'Tax'}
            handleBack={handleBackButton}
          />
          <Card type="large">
            <Text
              type="primary"
              header={__('How would you like to collect tax?', 'kirki-ecommerce')}
              subHeader={__(
                'Configure how tax is displayed and how it appears on your product listings.',
                'kirki-ecommerce',
              )}
              style={{ gap: 'var(--decom-spacing-f3)' }}
            />
            <Flex direction="column" gap={12}>
              <RadioGroup
                optionsArray={optionsArray}
                onChange={(value) => handleTaxCollection(value, '')}
                type="checked"
                value={
                  isTaxInclusivePrice
                    ? __('inclusive', 'kirki-ecommerce')
                    : __('not_inclusive', 'kirki-ecommerce')
                }
              />
              <div>
                <Separator style={{ marginBottom: 'var(--decom-spacing-3)' }} />
                {isTaxInclusivePrice ? (
                  <Checkbox
                    label={__('Charge shipping tax', 'kirki-ecommerce')}
                    helpText={__('Set charge for shipping tax', 'kirki-ecommerce')}
                    onChange={(value) => {
                      setEnableShippingTax(value);
                      setUnsavedDataStatus(true);
                    }}
                    value={enableShippingTax}
                  />
                ) : (
                  <Checkbox
                    label={__('Display prices inclusive tax', 'kirki-ecommerce')}
                    helpText={__(
                      'Tax value will be included inside the product price',
                      'kirki-ecommerce',
                    )}
                    onChange={(value) => {
                      setEnableTaxPrice(value);
                      setUnsavedDataStatus(true);
                    }}
                    value={enableTaxPrice}
                  />
                )}
              </div>
            </Flex>
          </Card>
          <TaxRegions
            taxRegions={taxRegions}
            setTaxRegions={setTaxRegions}
            handleSave={handleSaveTaxSettings}
            errors={errors}
          />
          <TaxProfile />
          {/* TODO: enable when feature is finalized */}

          {/* <SellerTaxID />
          <TaxServices />
          <TaxSimulator /> */}
        </Flex>
      </Container>
    </>
  );
};

TaxSettings.displayName = 'TaxSettings';

export default TaxSettings;
