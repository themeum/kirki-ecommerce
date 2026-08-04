import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryKeys } from '@/libs/query-keys';
import { getDefaults, pickFormValues } from '@/libs/zod';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { TaxRegionEuFormSchema, type TaxRegionEuFormInput } from '@/schemas/forms/tax-region-eu-form';
import { TaxSettingsFormSchema, type TaxSettingsFormPayload } from '@/schemas/forms/tax-settings-form';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import type { TaxRate, TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import TaxRules from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules';
import { VatCollection } from '@/pages/settings/tax-settings/tax-region/vat-collection/vat-collection';

type TaxSettingsFormData = Omit<SettingsSectionData, 'tax_regions'> & {
  tax_regions?: TaxRegion[];
};

const VatCollectionProcessRadios = () => {
  const { control, setValue, getValues } =
    useFormContext<TaxRegionEuFormInput>();

  const handleProcessChange = (value: string | number) => {
    const nextType = String(value);
    setValue('type', nextType, { shouldDirty: true });

    if (nextType === 'micro_business') {
      const currentList = getValues('product_tax') || [];
      if (Array.isArray(currentList) && currentList.length > 0) {
        setValue('product_tax', [currentList[0]], { shouldDirty: true });
      }
    }
  };

  return (
    <Flex direction={'column'} gap={2}>
      <Card cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)} >
        <CardContent cssOverride={cardStyles.innerContent}>

        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => handleProcessChange(value)}
                aria-invalid={fieldState.invalid}
              >
                <Field orientation="horizontal">
                  <RadioGroupItem value="oss" id="vat-process-oss" />
                  <FieldLabel htmlFor="vat-process-oss">
                    {__('One Stop Shop (OSS)', 'kirki-ecommerce')}
                  </FieldLabel>
                </Field>
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <VatProcessDescription processValue="oss" />
        </CardContent>
      </Card>

      <Card cssOverride={mergeCss(cardStyles.innerCard, styles.vatProcessCard)} >
        <CardContent cssOverride={cardStyles.innerContent}>

        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => handleProcessChange(value)}
                aria-invalid={fieldState.invalid}
              >
                <Field orientation="horizontal">
                  <RadioGroupItem
                    value="micro_business"
                    id="vat-process-micro-business"
                  />
                  <FieldLabel htmlFor="vat-process-micro-business">
                    {__('Micro Business', 'kirki-ecommerce')}
                  </FieldLabel>
                </Field>
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <VatProcessDescription processValue="micro_business" />
        </CardContent>
      </Card>
    </Flex>
  );
};

const VatProcessDescription = ({
  processValue,
}: {
  processValue: string;
}) => {
  const currentProcess = useWatch<TaxRegionEuFormInput>({ name: 'type' });

  if (currentProcess !== processValue) {
    return null;
  }

  return (
    <Card cssOverride={cardStyles.innerDarkCard} >
      <CardContent cssOverride={cardStyles.innerDarkContent}>

      <Text color="secondary">{processValue === 'oss'
      ? __(
      'Applies to businesses selling across multiple EU countries under OSS.',
      'kirki-ecommerce',
      )
      : __(
      'Applies to businesses with less than €10,000 EU sales.',
      'kirki-ecommerce',
      )}</Text>
      </CardContent>
    </Card>
  );
};

const EditRegionEU = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [regions, setRegions] = useState<TaxRegion[]>([]);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'tax'>();

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
  const vatCollectionList =
    (useWatch({ control: form.control, name: 'product_tax' }) as TaxRate[]) ||
    [];

  const euRegion = useMemo(() => {
    const base = regions.find((region) => region.code === 'EU');
    if (!base) {
      return base;
    }
    return {
      ...base,
      type: vatCollectionProcess,
      product_tax: vatCollectionList,
    };
  }, [regions, vatCollectionProcess, vatCollectionList]);

  useEffect(() => {
    const regionList = (taxSettingsData as TaxSettingsFormData)?.tax_regions;
    if (!Array.isArray(regionList)) {
      return;
    }

    setRegions(regionList);
    const eu = regionList.find((region) => region.code === 'EU');
    form.reset({
      type: eu?.type ? String(eu.type) : 'oss',
      product_tax: eu?.product_tax || [],
    });
  }, [taxSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const buildUpdatedRegions = (
    values: TaxRegionEuFormInput,
    overrides?: Partial<TaxRegion>,
  ): TaxRegion[] => {
    return regions.map((region) =>
      region.code === 'EU'
        ? {
            ...region,
            type: values.type,
            product_tax: values.product_tax,
            ...overrides,
          }
        : region,
    );
  };

  const updateEUVatCollection = async (vatList: TaxRate[], from = '') => {
    form.setValue('product_tax', vatList, {
      shouldDirty: from !== 'delete',
    });
    const updatedData = buildUpdatedRegions(form.getValues(), {
      product_tax: vatList,
    });
    setRegions(updatedData);
    await handleSaveData(updatedData, from);
  };

  const updateTaxRules = async (rulesList: TaxRule[], from = '') => {
    const updatedRules = regions.map((region) =>
      region.code === 'EU' ? { ...region, rules: rulesList } : region,
    );
    setRegions(updatedRules);
    await handleSaveData(updatedRules, from);
  };

  const handleSaveData = async (
    updatedDataObj?: TaxRegion[],
    from = '',
  ) => {
    const values = form.getValues();
    const taxRegions = updatedDataObj ?? buildUpdatedRegions(values);
    const currentTaxSettings = TaxSettingsFormSchema.parse(
      pickFormValues(TaxSettingsFormSchema, taxSettingsData ?? {}),
    );
    const payload: TaxSettingsFormPayload = {
      ...currentTaxSettings,
      tax_regions: taxRegions as TaxSettingsFormPayload['tax_regions'],
    };

    if (from === 'delete') {
      try {
        await updateSettings({ key: 'tax', data: payload });
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
                icon={'🇪🇺'}
                onBack={() => navigate('/settings/tax')}
              />

              <Card cssOverride={cardStyles.largeCard} >
                <CardContent cssOverride={cardStyles.largeContentPadded}>

                <Text weight="semibold">{__('How would you like to collect VAT?', 'kirki-ecommerce')}</Text>
                <VatCollectionProcessRadios />
                </CardContent>
              </Card>

              <VatCollection
                region={euRegion}
                process={vatCollectionProcess || 'oss'}
                vatCollectionList={vatCollectionList}
                setVatCollectionList={(updater) => {
                  const next =
                    typeof updater === 'function'
                      ? updater(vatCollectionList)
                      : updater;
                  form.setValue('product_tax', next, { shouldDirty: true });
                }}
                updateVatCollection={updateEUVatCollection}
              />
              <TaxRules region={euRegion} updateTaxRules={updateTaxRules} />
            </Flex>
          </Form>
        ) : (
          <div>{__('Loading ...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

EditRegionEU.displayName = 'EditRegionEU';

export default EditRegionEU;

const styles = defineStyles({
  vatProcessCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  }
});
