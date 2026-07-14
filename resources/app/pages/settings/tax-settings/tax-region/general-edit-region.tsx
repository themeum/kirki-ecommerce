import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import HeaderActionsCard from '@/components/header-actions-card';
import PageNavbar from '@/components/page-navbar';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { queryKeys } from '@/libs/query-keys';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import { toastMutationError } from '@/services/helpers';
import {
  updateSettings,
  useSettingsQuery,
  useUpdateSettingsMutation,
} from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { checkUnsavedDataStatus, setUnsavedDataStatus } from '@/pages/settings/utils';
import type { TaxRate, TaxRegion, TaxRegionState, TaxRule } from '@/pages/settings/tax-settings/utils';
import AddCitiesPopup from '@/pages/settings/tax-settings/tax-region/add-cities-popup';
import { SingleTaxRate } from '@/pages/settings/tax-settings/tax-region/single-tax-rate';
import { TaxRateList } from '@/pages/settings/tax-settings/tax-region/tax-rate-list';
import TaxRules from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type TaxSettingsFormData = SettingsSectionData & {
  tax_regions?: TaxRegion[];
};

const GeneralEditRegion = () => {
  let { code } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [dataObj, setDataObj] = useState<TaxRegion[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [selectedCities, setSelectedCities] = useState<TaxRegionState[]>([]);
  const [applySingleTax, setApplySingleTax] = useState(false);
  const [centralTaxValue, setCentralTaxValue] = useState<number | string>(0);
  const [showPopup, setShowPopup] = useState(false);

  const hasUnsavedData = useUnsavedStatus();
  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const selectedCountry = useMemo(() => {
    return dataObj.find((country) => country.code === code);
  }, [dataObj]);

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setDataObj(taxSettingsData.tax_regions as TaxRegion[]);
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!dataObj.length) {
      return;
    }
    setInitialData();
  }, [dataObj, code]);

  const setInitialData = () => {
    const country = dataObj.find((country) => country.code === code);
    if (country?.product_tax?.length) {
      setTaxRates(country.product_tax);
    } else {
      setTaxRates([]);
    }
    setCentralTaxValue(country?.central_product_tax || 0);
    setApplySingleTax(country?.is_central_tax_enabled || false);
  };

  const handleAddCities = () => {
    const newTaxRates: TaxRate[] = selectedCities.map((city) => ({
      state: String(city.title ?? ''),
      rate: 0,
    }));

    setUnsavedDataStatus(true);
    setTaxRates((prev = []) => {
      const existingStates = new Set(prev.map((t) => t.state));
      return [
        ...prev,
        ...newTaxRates.filter((t) => !existingStates.has(t.state)),
      ];
    });

    setShowPopup(false);
  };

  const handleApplySingleTax = () => {
    setApplySingleTax(!applySingleTax);
    setUnsavedDataStatus(true);
    setSelectedCities([]);
  };

  const updateTaxRules = async (rulesList: TaxRule[]) => {
    const updatedData = dataObj?.map((region) =>
      region.code === selectedCountry?.code
        ? { ...region, rules: rulesList }
        : region,
    );
    setDataObj(updatedData);
    saveDataToDB(updatedData, 'delete');
  };

  const handleSaveData = async (updatedTaxRates?: TaxRate[], from = '') => {
    const updatedDataObj = dataObj.map((country) =>
      country.code === code
        ? {
            ...country,
            product_tax: updatedTaxRates ?? taxRates,
            is_central_tax_enabled: applySingleTax,
            central_product_tax: centralTaxValue,
          }
        : country,
    );
    saveDataToDB(updatedDataObj, from);
  };

  const saveDataToDB = (updatedDataObj: TaxRegion[], from = '') => {
    const payload: TaxSettingsFormData = {
      ...(taxSettingsData as TaxSettingsFormData),
      tax_regions: updatedDataObj,
    };

    if (from === 'delete') {
      updateSettings({ key: 'tax', data: payload })
        .then(() => {
          setSelectedCities([]);
          setUnsavedDataStatus(false);
          void queryClient.invalidateQueries({
            queryKey: queryKeys.Settings('tax'),
          });
        })
        .catch((error) => {
          toastMutationError(error);
        });
      return;
    }

    saveSettings(
      { key: 'tax', data: payload },
      {
        onSuccess: () => {
          setSelectedCities([]);
          setUnsavedDataStatus(false);
        },
      },
    );
  };

  const handleDiscardData = () => {
    setInitialData();
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    const updatedDataObj = dataObj.map((country) =>
      country.code === code
        ? {
            ...country,
            product_tax: taxRates,
            is_central_tax_enabled: applySingleTax,
            central_product_tax: centralTaxValue,
          }
        : country,
    );
    checkUnsavedDataStatus({
      initialDataObj: (taxSettingsData as TaxSettingsFormData)?.tax_regions,
      updatedDataObj: updatedDataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate('/settings/tax'),
        }),
      onClean: () => navigate('/settings/tax'),
    });
  };

  return (
    <div>
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
                  size="small"
                  onClick={handleDiscardData}
                  text={__('Cancel', 'kirki-ecommerce')}
                />
                <Button
                  type="primary"
                  size="small"
                  text={__('Save', 'kirki-ecommerce')}
                  onClick={() => handleSaveData()}
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
                text={selectedCountry?.name}
                textIcon={selectedCountry?.flag}
                handleBack={handleBackButton}
              />

              <Card type="large" style={{ gap: 'var(--decom-spacing-4)' }}>
                <HeaderActionsCard
                  header={__('Cities', 'kirki-ecommerce')}
                  subHeader={__('Set tax rates for specific cities', 'kirki-ecommerce')}
                  buttonText={__('Add', 'kirki-ecommerce')}
                  onAdd={() => setShowPopup(true)}
                  hideButton={applySingleTax}
                />
                <Checkbox
                  value={applySingleTax}
                  label={__(
                    'Apply single tax rate for entire country',
                    'kirki-ecommerce',
                  )}
                  onChange={handleApplySingleTax}
                />
                {applySingleTax ? (
                  <SingleTaxRate
                    centralTaxValue={centralTaxValue}
                    setCentralTaxValue={setCentralTaxValue}
                  />
                ) : (
                  <TaxRateList
                    taxRates={taxRates}
                    applySingleTax={applySingleTax}
                    setTaxRates={setTaxRates}
                    handleSaveData={handleSaveData}
                  />
                )}
              </Card>
              <TaxRules
                region={selectedCountry}
                updateTaxRules={updateTaxRules}
              />
            </Flex>
          ) : (
            <div>{__('Loading ...', 'kirki-ecommerce')}</div>
          )}
        </Container>
        {showPopup && (
          <AddCitiesPopup
            openPopup={showPopup}
            setOpenPopup={setShowPopup}
            taxRates={taxRates}
            countryName={selectedCountry?.name}
            cityList={selectedCountry?.states}
            selectedCities={selectedCities}
            setSelectedCities={setSelectedCities}
            onAdd={handleAddCities}
          />
        )}
      </>
    </div>
  );
};

GeneralEditRegion.displayName = 'GeneralEditRegion';

export default GeneralEditRegion;
