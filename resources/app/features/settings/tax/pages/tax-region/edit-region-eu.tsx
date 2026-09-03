import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import VatProcessField from '@/features/settings/tax/components/fields/vat-process-field';
import { useInvalidateTaxSettings } from '@/features/settings/tax/hooks/use-invalidate-tax-settings';
import {
  applyEuRegionUpdate,
  applyRegionRules,
  deriveEuRegion,
} from '@/features/settings/tax/lib/region-tax';
import type {
  CountryTaxRate,
  EuTaxRegion,
  TaxRegion,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/lib/utils';
import TaxRules from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules';
import { VatCollection } from '@/features/settings/tax/pages/tax-region/vat-collection/vat-collection';
import {
  type TaxRegionEuFormInput,
  TaxRegionEuFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-region-eu-form';
import {
  type TaxSettingsFormPayload,
  TaxSettingsFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-settings-form';
import TaxRegionSkeleton from '@/features/settings/tax/skeletons/tax-region-skeleton';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { TaxSettings } from '@/schemas/catalog/settings';
import { useCountriesQuery } from '@/services/country';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

type TaxSettingsFormData = Omit<TaxSettings, 'tax_regions'> & {
  tax_regions?: TaxRegion[];
};

const EditRegionEU = () => {
  const navigate = useNavigate();
  const invalidateTaxSettings = useInvalidateTaxSettings();
  const [regions, setRegions] = useState<TaxRegion[]>([]);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionEuFormInput>({
    resolver: zodResolver(TaxRegionEuFormSchema),
    defaultValues: getDefaults(TaxRegionEuFormSchema),
  });

  const { isDirty } = form.formState;
  const vatCollectionProcess = useWatch({
    control: form.control,
    name: 'type',
  });
  const watchedCountries = useWatch({
    control: form.control,
    name: 'countries',
  });
  const vatCollectionList = useMemo<CountryTaxRate[]>(
    () => watchedCountries ?? [],
    [watchedCountries],
  );

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  /**
   * Member countries are identified by their code, never their name — the same
   * key the EU strategy matches a shopper's address on.
   */
  const euMemberCountries = useMemo<TaxRegionState[]>(
    () =>
      countryList
        .filter((item) => item.group === 'eu')
        .map((item) => ({ id: item.code, code: item.code, name: item.name, flag: item.flag })),
    [countryList],
  );

  const euRegion = useMemo(
    () =>
      deriveEuRegion(regions, vatCollectionProcess, vatCollectionList) as EuTaxRegion | undefined,
    [regions, vatCollectionProcess, vatCollectionList],
  );

  useEffect(() => {
    const regionList = (taxSettingsData as TaxSettingsFormData)?.tax_regions;
    if (!Array.isArray(regionList)) {
      return;
    }

    setRegions(regionList);
    const eu = regionList.find((region) => region.code === 'EU') as EuTaxRegion | undefined;
    form.reset({
      type: eu?.type === 'micro_business' ? 'micro_business' : 'oss',
      countries: eu?.countries ?? [],
    });
  }, [taxSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const buildUpdatedRegions = (
    values: TaxRegionEuFormInput,
    overrides?: Partial<TaxRegion>,
  ): TaxRegion[] => applyEuRegionUpdate(regions, values, overrides);

  const updateTaxRules = async (rulesList: TaxRule[], from = '') => {
    const updatedRules = applyRegionRules(regions, 'EU', rulesList);
    setRegions(updatedRules);
    await handleSaveData(updatedRules, from);
  };

  const handleSaveData = async (updatedDataObj?: TaxRegion[], from = '') => {
    const values = form.getValues();
    const taxRegions = updatedDataObj ?? buildUpdatedRegions(values);
    const currentTaxSettings = TaxSettingsFormSchema.parse(
      pickFormValues(TaxSettingsFormSchema, taxSettingsData ?? {}),
    );
    const payload: TaxSettingsFormPayload = {
      ...currentTaxSettings,
      tax_regions: taxRegions,
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
      form.reset(values);
      setRegions(taxRegions);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit(() => handleSaveData()),
    onDiscard: handleDiscardData,
  });

  return (
    <>
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader
                title={__('EU', 'kirki-ecommerce')}
                icon="🇪🇺"
                onBack={() => navigate(RouteConfig.Settings.get('TaxSettings').buildLink())}
              />

              <Card cssOverride={cardStyles.formCard}>
                <CardContent>
                  <Text weight="semibold">
                    {__('How would you like to collect VAT?', 'kirki-ecommerce')}
                  </Text>
                  <VatProcessField />
                </CardContent>
              </Card>

              <VatCollection
                memberCountries={euMemberCountries}
                process={vatCollectionProcess || 'oss'}
                vatCollectionList={vatCollectionList}
                setVatCollectionList={(updater) => {
                  const next = typeof updater === 'function' ? updater(vatCollectionList) : updater;
                  form.setValue('countries', next, { shouldDirty: true });
                }}
              />
              <TaxRules
                rules={euRegion?.rules ?? []}
                states={euMemberCountries}
                destinationLabel={__('EU', 'kirki-ecommerce')}
                updateTaxRules={updateTaxRules}
              />
            </Flex>
          </Form>
        ) : (
          <TaxRegionSkeleton />
        )}
      </Container>
    </>
  );
};

EditRegionEU.displayName = 'EditRegionEU';

export default EditRegionEU;
