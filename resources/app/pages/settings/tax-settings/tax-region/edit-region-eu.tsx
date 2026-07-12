import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import PageNavbar from '@/components/page-navbar';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { RadioGroup } from '@/molecules/radio-group';
import Text from '@/molecules/text';
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
import type { TaxRate, TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import TaxRules from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules';
import { VatCollection } from '@/pages/settings/tax-settings/tax-region/vat-collection/vat-collection';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type TaxSettingsFormData = Omit<SettingsSectionData, 'tax_regions'> & {
  tax_regions?: TaxRegion[];
};

const EditRegionEU = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [vatCollectionList, setVatCollectionList] = useState<TaxRate[]>([]);
  const [vatCollectionProcess, setVatCollectionProcess] = useState('oss');
  const [dataObj, setDataObj] = useState<TaxRegion[]>([]);

  const hasUnsavedData = useUnsavedStatus();
  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutate: saveSettings } = useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const euRegion = useMemo(() => {
    return dataObj.find((region) => region.code === 'EU');
  }, [dataObj]);

  const setInitialData = () => {
    const regions = (taxSettingsData as TaxSettingsFormData)?.tax_regions;
    if (!Array.isArray(regions)) {
      return;
    }
    setDataObj(regions);
    const eu = regions.find((region) => region.code === 'EU');

    if (eu?.type) {
      setVatCollectionProcess(String(eu.type));
    }
    if (eu?.product_tax) {
      setVatCollectionList(eu.product_tax);
    }
  };

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setInitialData();
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!vatCollectionProcess) {
      return;
    }

    setDataObj((prev) =>
      prev.map((region) => {
        if (region.code !== 'EU') {
          return region;
        }
        let updatedProductTax = region.product_tax;

        if (
          vatCollectionProcess === 'micro_business' &&
          Array.isArray(region.product_tax) &&
          region.product_tax.length > 0
        ) {
          updatedProductTax = [region.product_tax[0]];
        }
        return {
          ...region,
          type: vatCollectionProcess,
          product_tax: updatedProductTax,
        };
      }),
    );

    if (vatCollectionProcess === 'micro_business') {
      setVatCollectionList((prev) =>
        Array.isArray(prev) && prev.length > 0 ? [prev[0]] : [],
      );
    }
  }, [vatCollectionProcess]);

  const updateEUVatCollection = async (vatList: TaxRate[], from = '') => {
    const updatedData = dataObj?.map((region) =>
      region.code === 'EU' ? { ...region, product_tax: vatList } : region,
    );
    setDataObj(updatedData);
    await handleSaveData(updatedData, from);
  };

  const updateTaxRules = async (rulesList: TaxRule[], from = '') => {
    const updatedRules = dataObj?.map((region) =>
      region.code === 'EU' ? { ...region, rules: rulesList } : region,
    );
    setDataObj(updatedRules);
    await handleSaveData(updatedRules, from);
  };

  const handleSaveData = async (updatedDataObj?: TaxRegion[], from = '') => {
    const payload: TaxSettingsFormData = {
      ...(taxSettingsData as TaxSettingsFormData),
      tax_regions: updatedDataObj ?? dataObj,
    };

    if (from === 'delete') {
      updateSettings({ key: 'tax', data: payload })
        .then(() => {
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
    checkUnsavedDataStatus({
      initialDataObj: (taxSettingsData as TaxSettingsFormData)?.tax_regions,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate('/settings/tax'),
        }),
      onClean: () => navigate('/settings/tax'),
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
              text={__('EU', 'kirki-ecommerce')}
              textIcon={'🇪🇺'}
              handleBack={handleBackButton}
            />

            <Card type="large">
              <Text
                type="primary"
                header={__('How would you like to collect VAT?', 'kirki-ecommerce')}
              />
              <Flex direction={'column'} gap={8}>
                <Card
                  type="inner"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--decom-spacing-2)',
                  }}
                >
                  <RadioGroup
                    optionsArray={[
                      {
                        title: __('One Stop Shop (OSS)', 'kirki-ecommerce'),
                        value: 'oss',
                      },
                    ]}
                    value={vatCollectionProcess}
                    onChange={(value) => {
                      setVatCollectionProcess(String(value));
                      setUnsavedDataStatus(true);
                    }}
                  />

                  {vatCollectionProcess === 'oss' && (
                    <Card type="innerDark">
                      <Text
                        subHeader={__(
                          'Applies to businesses selling across multiple EU countries under OSS.',
                          'kirki-ecommerce',
                        )}
                      />
                    </Card>
                  )}
                </Card>

                <Card
                  type="inner"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--decom-spacing-2)',
                  }}
                >
                  <RadioGroup
                    optionsArray={[
                      {
                        title: __('Micro Business', 'kirki-ecommerce'),
                        value: 'micro_business',
                      },
                    ]}
                    value={vatCollectionProcess}
                    onChange={(value) => {
                      setVatCollectionProcess(String(value));
                      setUnsavedDataStatus(true);
                    }}
                  />

                  {vatCollectionProcess === 'micro_business' && (
                    <Card type="innerDark">
                      <Text
                        subHeader={__(
                          'Applies to businesses with less than €10,000 EU sales.',
                          'kirki-ecommerce',
                        )}
                      />
                    </Card>
                  )}
                </Card>
              </Flex>
            </Card>

            <VatCollection
              region={euRegion}
              process={vatCollectionProcess}
              vatCollectionList={vatCollectionList}
              setVatCollectionList={setVatCollectionList}
              updateVatCollection={updateEUVatCollection}
            />
            <TaxRules region={euRegion} updateTaxRules={updateTaxRules} />
          </Flex>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

EditRegionEU.displayName = 'EditRegionEU';

export default EditRegionEU;
