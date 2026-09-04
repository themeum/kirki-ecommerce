import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useInvalidateTaxSettings } from '@/features/settings/tax/hooks/use-invalidate-tax-settings';
import {
  addStatesToRegion,
  applyRegionRules,
  applyRegionTaxUpdate,
} from '@/features/settings/tax/lib/region-tax';
import type {
  GeneralTaxRegion,
  TaxRegion,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/lib/utils';
import AddCitiesPopup from '@/features/settings/tax/pages/tax-region/add-cities-dialog';
import SingleTaxRate from '@/features/settings/tax/pages/tax-region/single-tax-rate';
import TaxRules from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules';
import TaxStateRows from '@/features/settings/tax/pages/tax-region/tax-state-rows';
import {
  type TaxRegionGeneralFormInput,
  type TaxRegionGeneralFormPayload,
  TaxRegionGeneralFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-region-general-form';
import {
  type TaxSettingsFormPayload,
  TaxSettingsFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-settings-form';
import TaxRegionSkeleton from '@/features/settings/tax/skeletons/tax-region-skeleton';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

const GeneralEditRegion = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const invalidateTaxSettings = useInvalidateTaxSettings();
  const [regions, setRegions] = useState<TaxRegion[]>([]);
  const [selectedCities, setSelectedCities] = useState<TaxRegionState[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionGeneralFormInput, unknown, TaxRegionGeneralFormPayload>({
    resolver: zodResolver(TaxRegionGeneralFormSchema),
    defaultValues: getDefaults(TaxRegionGeneralFormSchema),
  });

  const { isDirty } = form.formState;
  const applySingleTax = useWatch({ control: form.control, name: 'is_central_tax_enabled' });
  const usedStates = useWatch({ control: form.control, name: 'states' });
  const centralTaxRules = useWatch({ control: form.control, name: 'rules' });

  const country = useMemo(
    () => countryList.find((item) => item.code === code),
    [countryList, code],
  );

  const usedRegion = useMemo(() => regions.find((region) => region.code === code), [regions, code]);

  const countryStates = useMemo<TaxRegionState[]>(
    () => (country?.states ?? []).map((state) => ({ ...state, id: String(state.id) })),
    [country],
  );

  const stateNameById = useMemo(
    () =>
      countryStates.reduce<Record<string, string>>((acc, state) => {
        acc[String(state.id)] = state.name ?? String(state.id);
        return acc;
      }, {}),
    [countryStates],
  );

  const usedStateIds = useMemo(() => {
    if (!isDefined(usedStates)) {
      return new Set<string>();
    }
    return new Set(usedStates.map((state) => String(state.id)));
  }, [usedStates]);

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setRegions(taxSettingsData.tax_regions);
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!regions.length || !code) {
      return;
    }

    const region = regions.find((item) => item.code === code) as GeneralTaxRegion | undefined;
    form.reset({
      is_central_tax_enabled: region?.is_central_tax_enabled ?? true,
      central_product_tax: Number(region?.central_product_tax) || null,
      central_shipping_tax: Number(region?.central_shipping_tax) || null,
      states: region?.states ?? [],
      rules: region?.rules ?? [],
    });
  }, [regions, code, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const saveRegions = async (updatedRegions: TaxRegion[], from = '') => {
    const currentTaxSettings = TaxSettingsFormSchema.parse(
      pickFormValues(TaxSettingsFormSchema, taxSettingsData ?? {}),
    );
    const payload: TaxSettingsFormPayload = {
      ...currentTaxSettings,
      tax_regions: updatedRegions,
    };

    if (from === 'delete') {
      try {
        await updateSettings({ key: 'tax', data: payload });
        setUnsavedDataStatus(false);
        invalidateTaxSettings();
      } catch (error) {
        toastMutationError(error);
      }
      return;
    }

    try {
      await saveSettings({ key: 'tax', data: payload });
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleAddCities = async () => {
    if (!code) {
      return;
    }

    const nextStates = addStatesToRegion(usedStates ?? [], selectedCities);
    const firstNewId = isDefined(usedStates) ? nextStates[usedStates.length]?.id : null;

    setSelectedCities([]);
    setShowPopup(false);

    if (!firstNewId) {
      return;
    }

    const updatedRegions = applyRegionTaxUpdate(regions, code, {
      is_central_tax_enabled: false,
      central_product_tax: Number(form.getValues('central_product_tax')) || 0,
      central_shipping_tax: Number(form.getValues('central_shipping_tax')) || 0,
      states: nextStates,
    });

    setRegions(updatedRegions);
    await saveRegions(updatedRegions, 'delete');

    void navigate(
      RouteConfig.Settings.get('TaxSettings')
        .get('EditTaxRegionState')
        .buildLink({ code, state: String(firstNewId) }),
    );
  };

  const handleSaveData = async (values: TaxRegionGeneralFormPayload) => {
    if (!code) {
      return;
    }

    const updatedRegions = applyRegionRules(
      applyRegionTaxUpdate(regions, code, values),
      code,
      values.rules,
    );
    await saveRegions(updatedRegions);
    setRegions(updatedRegions);
    form.reset(values);
  };

  const updateRegionRules = useCallback(
    (rulesList: TaxRule[]) => {
      form.setValue('rules', rulesList, { shouldDirty: true });
    },
    [form],
  );

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit((values) => handleSaveData(values)),
    onDiscard: () => form.reset(),
  });

  return (
    <>
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader
                title={country?.name ?? usedRegion?.name ?? code}
                icon={country?.flag ?? usedRegion?.flag}
                onBack={() => navigate(RouteConfig.Settings.get('TaxSettings').buildLink())}
              />

              <Card cssOverride={mergeCss(cardStyles.formCard, styles.citiesCard)}>
                <CardContent>
                  <HeaderActionsCard
                    header={__('State & Rates', 'kirki-ecommerce')}
                    subHeader={sprintf(
                      /* translators: %s: Region name */
                      __(
                        'Set product and shipping tax rates for specific states/regions in %s.',
                        'kirki-ecommerce',
                      ),
                      country?.name ?? usedRegion?.name ?? code ?? '',
                    )}
                    buttonText={__('Add', 'kirki-ecommerce')}
                    onAdd={() => setShowPopup(true)}
                    hideButton={Boolean(applySingleTax)}
                  />
                  <div css={scoped({ marginTop: theme.spacing[5] })}>
                    <CheckboxField
                      name="is_central_tax_enabled"
                      label={__('Apply one rate for the entire country', 'kirki-ecommerce')}
                    />
                  </div>
                  <div css={scoped({ marginTop: theme.spacing[5] })}>
                    {applySingleTax ? (
                      <Flex direction="column" gap={2}>
                        <SingleTaxRate<TaxRegionGeneralFormInput>
                          name="central_product_tax"
                          label={__('Product Tax Rate', 'kirki-ecommerce')}
                          icon={<Package size={16} />}
                        />
                        <SingleTaxRate<TaxRegionGeneralFormInput>
                          name="central_shipping_tax"
                          label={__('Shipping Tax Rate', 'kirki-ecommerce')}
                          icon={<Truck size={16} />}
                        />
                      </Flex>
                    ) : (
                      <TaxStateRows code={code ?? ''} stateNameById={stateNameById} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rules are country-wide XOR per state: in per-state mode each state
                  carries its own, edited on that state's page. */}
              {applySingleTax && (
                <TaxRules
                  rules={centralTaxRules ?? []}
                  states={countryStates}
                  destinationLabel={country?.name ?? code}
                  updateTaxRules={updateRegionRules}
                />
              )}
            </Flex>
          </Form>
        ) : (
          <TaxRegionSkeleton />
        )}
      </Container>
      {showPopup && (
        <AddCitiesPopup
          openPopup={showPopup}
          setOpenPopup={setShowPopup}
          countryName={country?.name}
          cityList={countryStates}
          disabledIds={usedStateIds}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          onAdd={handleAddCities}
        />
      )}
    </>
  );
};

GeneralEditRegion.displayName = 'GeneralEditRegion';

export default GeneralEditRegion;

const styles = defineStyles({
  citiesCard: {
    gap: theme.spacing[4],
  },
});
