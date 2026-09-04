import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
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
import TaxRules from '@/features/settings/tax/shared/components/tax-rules/tax-rules';
import { useTaxRegionSettings } from '@/features/settings/tax/shared/hooks/use-tax-region-settings';
import type {
  CountryTaxRate,
  EuTaxRegion,
  TaxRegion,
  TaxRegionState,
  TaxRule,
} from '@/features/settings/tax/shared/lib/utils';
import TaxRegionSkeleton from '@/features/settings/tax/shared/skeletons/tax-region-skeleton';
import VatProcessField from '@/features/settings/tax/strategies/eu/components/fields/vat-process-field';
import { VatCollection } from '@/features/settings/tax/strategies/eu/components/vat-collection';
import { applyEuRegionUpdate } from '@/features/settings/tax/strategies/eu/lib/eu-region';
import {
  type TaxRegionEuFormInput,
  TaxRegionEuFormSchema,
} from '@/features/settings/tax/strategies/eu/schemas/forms/tax-region-eu-form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const EditRegionEU = () => {
  const navigate = useNavigate();
  const { loaded, regions, setRegions, isSaving, saveRegions } = useTaxRegionSettings();

  const form = useForm<TaxRegionEuFormInput>({
    resolver: zodResolver(TaxRegionEuFormSchema),
    defaultValues: getDefaults(TaxRegionEuFormSchema),
  });

  const { isDirty } = form.formState;
  const vatCollectionProcess = useWatch({
    control: form.control,
    name: 'type',
  });
  const usedCountries = useWatch({
    control: form.control,
    name: 'countries',
  });
  const vatCollectionList = useMemo<CountryTaxRate[]>(() => usedCountries ?? [], [usedCountries]);

  const { data: countryList = [] } = useCountriesQuery({ limit: -1 });

  const euMemberCountries = useMemo<TaxRegionState[]>(
    () =>
      countryList
        .filter((item) => item.group === 'eu')
        .map((item) => ({ id: item.code, code: item.code, name: item.name, flag: item.flag })),
    [countryList],
  );

  const watchedRules = useWatch({
    control: form.control,
    name: 'rules',
  });

  useEffect(() => {
    if (!regions.length) {
      return;
    }

    const eu = regions.find((region) => region.code === 'EU') as EuTaxRegion | undefined;
    form.reset({
      type: eu?.type === 'micro_business' ? 'micro_business' : 'oss',
      countries: eu?.countries ?? [],
      rules: eu?.rules ?? [],
    });
  }, [regions, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const updateTaxRules = useCallback(
    (rulesList: TaxRule[]) => {
      form.setValue('rules', rulesList, { shouldDirty: true });
    },
    [form],
  );

  const buildUpdatedRegions = (values: TaxRegionEuFormInput): TaxRegion[] =>
    applyEuRegionUpdate(regions, values, { rules: values.rules });

  const handleSaveData = async () => {
    const values = form.getValues();
    const taxRegions = buildUpdatedRegions(values);

    try {
      await saveRegions(taxRegions);
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
                rules={watchedRules ?? []}
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
