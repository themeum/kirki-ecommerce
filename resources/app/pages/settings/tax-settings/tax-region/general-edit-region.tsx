import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useOutletContext, useParams } from 'react-router';

import CheckboxField from '@/components/form/checkbox-field';
import HeaderActionsCard from '@/components/header-actions-card';
import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import PageHeading from '@/components/ui/page-heading';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryKeys } from '@/libs/query-keys';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import {
  TaxRegionGeneralFormSchema,
  taxRegionGeneralDefaultValues,
  type TaxRegionGeneralFormValues,
} from '@/schemas/forms/tax-region-general-form';
import { toastMutationError } from '@/services/helpers';
import {
  updateSettings,
  useSettingsQuery,
  useUpdateSettingsMutation,
} from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import AddCitiesPopup from '@/pages/settings/tax-settings/tax-region/add-cities-dialog';
import { SingleTaxRate } from '@/pages/settings/tax-settings/tax-region/single-tax-rate';
import { TaxRateList } from '@/pages/settings/tax-settings/tax-region/tax-rate-list';
import TaxRules from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules';
import type { TaxRate, TaxRegion, TaxRegionState, TaxRule } from '@/pages/settings/tax-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';

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
  const [regions, setRegions] = useState<TaxRegion[]>([]);
  const [selectedCities, setSelectedCities] = useState<TaxRegionState[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const hasUnsavedData = useUnsavedStatus();
  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionGeneralFormValues>({
    resolver: zodResolver(TaxRegionGeneralFormSchema),
    defaultValues: taxRegionGeneralDefaultValues,
  });

  const { isDirty } = form.formState;
  const applySingleTax = useWatch({
    control: form.control,
    name: 'is_central_tax_enabled',
  });
  const taxRates =
    (useWatch({ control: form.control, name: 'product_tax' }) as TaxRate[]) ||
    [];
  const centralTaxValue = useWatch({
    control: form.control,
    name: 'central_product_tax',
  });

  const selectedCountry = useMemo(() => {
    return regions.find((country) => country.code === code);
  }, [regions, code]);

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setRegions(taxSettingsData.tax_regions as TaxRegion[]);
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!regions.length || !code) {
      return;
    }

    const country = regions.find((item) => item.code === code);
    form.reset({
      product_tax: country?.product_tax?.length ? country.product_tax : [],
      is_central_tax_enabled: country?.is_central_tax_enabled || false,
      central_product_tax: country?.central_product_tax || 0,
    });
  }, [regions, code, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (applySingleTax) {
      setSelectedCities([]);
    }
  }, [applySingleTax]);

  const handleAddCities = () => {
    const newTaxRates: TaxRate[] = selectedCities.map((city) => ({
      state: String(city.title ?? ''),
      rate: 0,
    }));

    const existingStates = new Set(taxRates.map((t) => t.state));
    const nextRates = [
      ...taxRates,
      ...newTaxRates.filter((t) => !existingStates.has(t.state)),
    ];
    form.setValue('product_tax', nextRates, { shouldDirty: true });
    setShowPopup(false);
  };

  const buildUpdatedRegions = (
    values: TaxRegionGeneralFormValues,
    updatedTaxRates?: TaxRate[],
  ): TaxRegion[] => {
    return regions.map((country) =>
      country.code === code
        ? {
          ...country,
          product_tax: updatedTaxRates ?? values.product_tax ?? [],
          is_central_tax_enabled: values.is_central_tax_enabled,
          central_product_tax: values.central_product_tax,
        }
        : country,
    );
  };

  const updateTaxRules = async (rulesList: TaxRule[]) => {
    const updatedData = regions.map((region) =>
      region.code === selectedCountry?.code
        ? { ...region, rules: rulesList }
        : region,
    );
    setRegions(updatedData);
    await saveDataToDB(updatedData, 'delete');
  };

  const handleSaveData = async (
    values: TaxRegionGeneralFormValues,
    updatedTaxRates?: TaxRate[],
    from = '',
  ) => {
    const updatedDataObj = buildUpdatedRegions(values, updatedTaxRates);
    await saveDataToDB(updatedDataObj, from);
    if (from !== 'delete') {
      form.reset({
        ...values,
        product_tax: updatedTaxRates ?? values.product_tax,
      });
      setRegions(updatedDataObj);
    }
  };

  const saveDataToDB = async (updatedDataObj: TaxRegion[], from = '') => {
    const payload: TaxSettingsFormData = {
      ...(taxSettingsData as TaxSettingsFormData),
      tax_regions: updatedDataObj,
    };

    if (from === 'delete') {
      try {
        await updateSettings({ key: 'tax', data: payload });
        setSelectedCities([]);
        setUnsavedDataStatus(false);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.Settings('tax'),
        });
      } catch (error) {
        toastMutationError(error);
      }
      return;
    }

    try {
      await saveSettings({ key: 'tax', data: payload });
      setSelectedCities([]);
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
        action: () => navigate('/settings/tax'),
      });
      return;
    }
    navigate('/settings/tax');
  };

  const handleSaveFromRateList = async (
    updatedTaxRates?: TaxRate[],
    from = '',
  ) => {
    await handleSaveData(form.getValues(), updatedTaxRates, from);
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
                  variant="ghost"
                  onClick={handleDiscardData}
                  disabled={isSaving}
                >
                  {__('Cancel', 'kirki-ecommerce')}
                </Button>
                <Button
                  variant="primary"
                  onClick={form.handleSubmit((values) =>
                    handleSaveData(values),
                  )}
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
                  text={selectedCountry?.name}
                  textIcon={selectedCountry?.flag}
                  handleBack={handleBackButton}
                />

                <Card css={[cardStyles.largeCard, styles.citiesCard]} >
                  <CardContent css={cardStyles.largeContentPadded}>

                    <HeaderActionsCard
                      header={__('Cities', 'kirki-ecommerce')}
                      subHeader={__('Set tax rates for specific cities', 'kirki-ecommerce')}
                      buttonText={__('Add', 'kirki-ecommerce')}
                      onAdd={() => setShowPopup(true)}
                      hideButton={!!applySingleTax}
                    />
                    <CheckboxField
                      name="is_central_tax_enabled"
                      label={__(
                        'Apply single tax rate for entire country',
                        'kirki-ecommerce',
                      )}
                    />
                    {applySingleTax ? (
                      <SingleTaxRate
                        centralTaxValue={centralTaxValue ?? 0}
                        setCentralTaxValue={(value) =>
                          form.setValue('central_product_tax', value, {
                            shouldDirty: true,
                          })
                        }
                      />
                    ) : (
                      <TaxRateList
                        taxRates={taxRates}
                        applySingleTax={!!applySingleTax}
                        setTaxRates={(updater) => {
                          const next =
                            typeof updater === 'function'
                              ? updater(taxRates)
                              : updater;
                          form.setValue('product_tax', next, {
                            shouldDirty: true,
                          });
                        }}
                        handleSaveData={handleSaveFromRateList}
                      />
                    )}
                  </CardContent>
                </Card>
                <TaxRules
                  region={selectedCountry}
                  updateTaxRules={updateTaxRules}
                />
              </Flex>
            </Form>
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

const styles = {
  citiesCard: scoped({
    gap: theme.spacing[4],
  })
};
