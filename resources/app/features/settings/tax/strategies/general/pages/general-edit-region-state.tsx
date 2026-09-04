import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Truck } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SingleTaxRate from '@/features/settings/tax/shared/components/single-tax-rate';
import TaxRules from '@/features/settings/tax/shared/components/tax-rules/tax-rules';
import { useTaxRegionSettings } from '@/features/settings/tax/shared/hooks/use-tax-region-settings';
import type {
  GeneralTaxRegion,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/shared/lib/utils';
import { taxProfileConditionOptions } from '@/features/settings/tax/shared/lib/utils';
import TaxRegionSkeleton from '@/features/settings/tax/shared/skeletons/tax-region-skeleton';
import { updateRegionState } from '@/features/settings/tax/strategies/general/lib/region-tax';
import {
  type TaxRegionStateFormInput,
  type TaxRegionStateFormPayload,
  TaxRegionStateFormSchema,
} from '@/features/settings/tax/strategies/general/schemas/forms/tax-region-state-form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const GeneralEditRegionState = () => {
  const { code, state: stateId } = useParams();
  const navigate = useNavigate();
  const { loaded, regions, setRegions, isSaving, saveRegions } = useTaxRegionSettings();

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  const form = useForm<TaxRegionStateFormInput, unknown, TaxRegionStateFormPayload>({
    resolver: zodResolver(TaxRegionStateFormSchema),
    defaultValues: getDefaults(TaxRegionStateFormSchema),
  });

  const { isDirty } = form.formState;
  const stateRules = useWatch({ control: form.control, name: 'rules' });

  const country = useMemo(
    () => countryList.find((item) => item.code === code),
    [countryList, code],
  );

  const countryStates = useMemo<TaxRegionState[]>(
    () => (country?.states ?? []).map((item) => ({ ...item, id: String(item.id) })),
    [country],
  );

  const currentState = useMemo(() => {
    const region = regions.find((item) => item.code === code) as GeneralTaxRegion | undefined;
    return (region?.states ?? []).find((item) => String(item.id) === String(stateId));
  }, [regions, code, stateId]);

  const stateName = useMemo(
    () =>
      countryStates.find((item) => String(item.id) === String(stateId))?.name ??
      currentState?.name ??
      stateId,
    [countryStates, stateId, currentState],
  );

  useEffect(() => {
    if (!currentState) {
      return;
    }

    form.reset({
      product_tax_rate: Number(currentState.product_tax_rate) || null,
      shipping_tax_rate: Number(currentState.shipping_tax_rate) || null,
      rules: currentState.rules ?? [],
    });
  }, [currentState, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const backToRegion = useCallback(
    () =>
      navigate(
        RouteConfig.Settings.get('TaxSettings')
          .get('EditTaxRegion')
          .buildLink({ code: code ?? '' }),
      ),
    [navigate, code],
  );

  useEffect(() => {
    if (!loaded || !regions.length || currentState) {
      return;
    }

    void backToRegion();
  }, [loaded, regions, currentState, backToRegion]);

  const handleSaveData = async (values: TaxRegionStateFormPayload) => {
    if (!code || !stateId) {
      return;
    }

    const updatedRegions = updateRegionState(regions, code, stateId, values);

    try {
      await saveRegions(updatedRegions);
      setRegions(updatedRegions);
      form.reset(values);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const updateStateRules = useCallback(
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
    <Container size="sm">
      {loaded && currentState ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader title={stateName} onBack={backToRegion} />

            <Card cssOverride={mergeCss(cardStyles.formCard)}>
              <CardContent>
                <Flex direction="column" gap={2}>
                  <SingleTaxRate<TaxRegionStateFormInput>
                    name="product_tax_rate"
                    label={__('Product Tax Rate', 'kirki-ecommerce')}
                    icon={<Package size={16} />}
                    description={__(
                      'Define how taxes are calculated for products based on buyer location.',
                      'kirki-ecommerce',
                    )}
                    cssOverride={{ padding: `${theme.spacing[2]} 0` }}
                  />
                  <SingleTaxRate<TaxRegionStateFormInput>
                    name="shipping_tax_rate"
                    label={__('Shipping Tax Rate', 'kirki-ecommerce')}
                    icon={<Truck size={16} />}
                    description={__(
                      'Define how taxes are applied to shipping charges.',
                      'kirki-ecommerce',
                    )}
                    cssOverride={{ padding: `${theme.spacing[2]} 0` }}
                  />
                </Flex>
              </CardContent>
            </Card>

            <TaxRules
              rules={stateRules ?? []}
              states={countryStates}
              destinationLabel={country?.name ?? code}
              updateTaxRules={updateStateRules}
              conditionOptions={taxProfileConditionOptions}
            />
          </Flex>
        </Form>
      ) : (
        <TaxRegionSkeleton />
      )}
    </Container>
  );
};

GeneralEditRegionState.displayName = 'GeneralEditRegionState';

export default GeneralEditRegionState;
