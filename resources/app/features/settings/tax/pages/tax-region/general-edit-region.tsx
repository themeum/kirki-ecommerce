import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import CheckboxField from '@/components/form/checkbox-field';
import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import type { TaxRate, TaxRegion, TaxRegionState, TaxRule } from '@/features/settings/tax/lib/utils';
import AddCitiesPopup from '@/features/settings/tax/pages/tax-region/add-cities-dialog';
import { SingleTaxRate } from '@/features/settings/tax/pages/tax-region/single-tax-rate';
import { TaxRateList } from '@/features/settings/tax/pages/tax-region/tax-rate-list';
import TaxRules from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules';
import { type TaxRegionGeneralFormInput, TaxRegionGeneralFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-general-form';
import { type TaxSettingsFormPayload, TaxSettingsFormSchema } from '@/features/settings/tax/schemas/forms/tax-settings-form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { settingsKeys } from '@/libs/query-keys';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const GeneralEditRegion = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [regions, setRegions] = useState<TaxRegion[]>([]);
  const [selectedCities, setSelectedCities] = useState<TaxRegionState[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionGeneralFormInput>({
    resolver: zodResolver(TaxRegionGeneralFormSchema),
    defaultValues: getDefaults(TaxRegionGeneralFormSchema),
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
    values: TaxRegionGeneralFormInput,
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
    values: TaxRegionGeneralFormInput,
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
    const currentTaxSettings = TaxSettingsFormSchema.parse(
      pickFormValues(TaxSettingsFormSchema, taxSettingsData ?? {}),
    );
    const payload: TaxSettingsFormPayload = {
      ...currentTaxSettings,
      tax_regions: updatedDataObj as TaxSettingsFormPayload['tax_regions'],
    };

    if (from === 'delete') {
      try {
        await updateSettings({ key: 'tax', data: payload });
        setSelectedCities([]);
        setUnsavedDataStatus(false);
        void queryClient.invalidateQueries({
          queryKey: settingsKeys.section('tax'),
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

  const handleSaveFromRateList = async (
    updatedTaxRates?: TaxRate[],
    from = '',
  ) => {
    await handleSaveData(form.getValues(), updatedTaxRates, from);
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit((values) => handleSaveData(values)),
    onDiscard: handleDiscardData,
  });

  return (
    <div>
      <>
        <Container size="sm">
          {loaded ? (
            <Form {...form}>
              <Flex direction="column" gap={4}>
                <SettingsPageHeader
                  title={selectedCountry?.name}
                  icon={selectedCountry?.flag}
                  onBack={() => navigate(RouteConfig.Settings.get('TaxSettings').buildLink())}
                />

                <Card cssOverride={mergeCss(cardStyles.formCard, styles.citiesCard)} >
                  <CardContent>
                    <HeaderActionsCard
                      header={__('Cities', 'kirki-ecommerce')}
                      subHeader={__('Set tax rates for specific cities', 'kirki-ecommerce')}
                      buttonText={__('Add', 'kirki-ecommerce')}
                      onAdd={() => setShowPopup(true)}
                      hideButton={!!applySingleTax}
                    />
                    <div css={scoped({ marginTop: theme.spacing[5] })}>
                      <CheckboxField
                        name="is_central_tax_enabled"
                        label={__(
                          'Apply single tax rate for entire country',
                          'kirki-ecommerce',
                        )}
                      />
                    </div>
                    <div css={scoped({ marginTop: theme.spacing[5] })}>
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

                    </div>
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

const styles = defineStyles({
  citiesCard: {
    gap: theme.spacing[4],
  },
});
