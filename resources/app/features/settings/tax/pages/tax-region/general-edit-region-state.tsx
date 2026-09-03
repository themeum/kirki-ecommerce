import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { useInvalidateTaxSettings } from '@/features/settings/tax/hooks/use-invalidate-tax-settings';
import { updateRegionState } from '@/features/settings/tax/lib/region-tax';
import type {
  GeneralTaxRegion,
  TaxRegion,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/lib/utils';
import SingleTaxRate from '@/features/settings/tax/pages/tax-region/single-tax-rate';
import TaxRules from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules';
import {
  type TaxRegionStateFormInput,
  type TaxRegionStateFormPayload,
  TaxRegionStateFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-region-state-form';
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
import { cardStyles } from '@/theme/card-styles';
import { mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const GeneralEditRegionState = () => {
  const { code, state: stateId } = useParams();
  const navigate = useNavigate();
  const invalidateTaxSettings = useInvalidateTaxSettings();
  const [regions, setRegions] = useState<TaxRegion[]>([]);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionStateFormInput, unknown, TaxRegionStateFormPayload>({
    resolver: zodResolver(TaxRegionStateFormSchema),
    defaultValues: getDefaults(TaxRegionStateFormSchema),
  });

  const { isDirty } = form.formState;

  const country = useMemo(
    () => countryList.find((item) => item.code === code),
    [countryList, code],
  );

  const countryStates = useMemo<TaxRegionState[]>(
    () => (country?.states ?? []).map((item) => ({ ...item, id: String(item.id) })),
    [country],
  );

  const storedState = useMemo(() => {
    const region = regions.find((item) => item.code === code) as GeneralTaxRegion | undefined;
    return (region?.states ?? []).find((item) => String(item.id) === String(stateId));
  }, [regions, code, stateId]);

  const stateName = useMemo(
    () =>
      countryStates.find((item) => String(item.id) === String(stateId))?.name ??
      storedState?.name ??
      stateId,
    [countryStates, stateId, storedState],
  );

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setRegions(taxSettingsData.tax_regions);
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!storedState) {
      return;
    }

    form.reset({
      product_tax_rate: storedState.product_tax_rate ?? 0,
      shipping_tax_rate: storedState.shipping_tax_rate ?? 0,
    });
  }, [storedState, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const backToRegion = () =>
    navigate(
      RouteConfig.Settings.get('TaxSettings')
        .get('EditTaxRegion')
        .buildLink({ code: code ?? '' }),
    );

  /**
   * The state can only go missing when the region no longer lists it — a
   * removal from the region page, or a hand-typed URL. Either way there is
   * nothing to edit, so fall back to the region.
   */
  useEffect(() => {
    if (!loaded || !regions.length || storedState) {
      return;
    }

    void backToRegion();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirects once the load settles; backToRegion is stable enough and re-running on it would loop
  }, [loaded, regions, storedState]);

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

  const handleSaveData = async (values: TaxRegionStateFormPayload) => {
    if (!code || !stateId) {
      return;
    }

    const updatedRegions = updateRegionState(regions, code, stateId, values);
    await saveRegions(updatedRegions);
    setRegions(updatedRegions);
    form.reset(values);
  };

  const updateStateRules = async (rulesList: TaxRule[]) => {
    if (!code || !stateId) {
      return;
    }

    const updatedRegions = updateRegionState(regions, code, stateId, { rules: rulesList });
    setRegions(updatedRegions);
    await saveRegions(updatedRegions, 'delete');
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit((values) => handleSaveData(values)),
    onDiscard: () => form.reset(),
  });

  return (
    <Container size="sm">
      {loaded && storedState ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader title={stateName} icon={country?.flag} onBack={backToRegion} />

            <Card cssOverride={mergeCss(cardStyles.formCard)}>
              <CardContent>
                <Flex direction="column" gap={2}>
                  <SingleTaxRate<TaxRegionStateFormInput>
                    name="product_tax_rate"
                    label={__('Product Tax Rate', 'kirki-ecommerce')}
                    icon={<Package size={16} />}
                  />
                  <SingleTaxRate<TaxRegionStateFormInput>
                    name="shipping_tax_rate"
                    label={__('Shipping Tax Rate', 'kirki-ecommerce')}
                    icon={<Truck size={16} />}
                  />
                </Flex>
              </CardContent>
            </Card>

            <TaxRules
              rules={storedState.rules ?? []}
              states={countryStates}
              destinationLabel={country?.name ?? code}
              updateTaxRules={updateStateRules}
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
