import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { useInvalidateTaxSettings } from '@/features/settings/tax/hooks/use-invalidate-tax-settings';
import { applyEuRegionUpdate, applyRegionRules, deriveEuRegion, resolveVatProcessChange } from '@/features/settings/tax/lib/region-tax';
import type { TaxRate, TaxRegion, TaxRule } from '@/features/settings/tax/lib/utils';
import TaxRules from '@/features/settings/tax/pages/tax-region/tax-rules/tax-rules';
import { VatCollection } from '@/features/settings/tax/pages/tax-region/vat-collection/vat-collection';
import { type TaxRegionEuFormInput, TaxRegionEuFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-eu-form';
import { type TaxSettingsFormPayload, TaxSettingsFormSchema } from '@/features/settings/tax/schemas/forms/tax-settings-form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import type { TaxSettings } from '@/schemas/catalog/settings';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type TaxSettingsFormData = Omit<TaxSettings, 'tax_regions'> & {
  tax_regions?: TaxRegion[];
};

const VatCollectionProcessRadios = () => {
  const { control, setValue, getValues } =
    useFormContext<TaxRegionEuFormInput>();

  const handleProcessChange = (value: string | number) => {
    const nextType = String(value);
    setValue('type', nextType, { shouldDirty: true });

    const nextProductTax = resolveVatProcessChange(nextType, getValues('product_tax') ?? []);
    if (nextProductTax) {
      setValue('product_tax', nextProductTax, { shouldDirty: true });
    }
  };

  return (
    <Flex direction="column" gap={2} cssOverride={{ marginTop: theme.spacing[5] }}>
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
    <Card cssOverride={{ ...cardStyles.innerDarkCard, marginTop: theme.spacing[2] }} >
      <CardContent cssOverride={cardStyles.innerDarkContent}>
        <Text color="secondary" variant="small">
          {processValue === 'oss' ?
            __(
              'Collect VAT based on the customer’s EU country for cross-border sales. VAT from all EU countries is reported through a single OSS return. Required once your EU cross-border sales exceed €10,000 per year.',
              'kirki-ecommerce',
            )
            : __(
              'Collect VAT using your local country’s rate only. Applies when selling mainly within your own country. Available while EU cross-border sales remain below €10,000 per year.',
              'kirki-ecommerce',
            )
          }
        </Text>
      </CardContent>
    </Card>
  );
};

const EditRegionEU = () => {
  const navigate = useNavigate();
  const invalidateTaxSettings = useInvalidateTaxSettings();
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
  const watchedProductTax = useWatch({
    control: form.control,
    name: 'product_tax',
  });
  const vatCollectionList = useMemo(
    () => watchedProductTax ?? [],
    [watchedProductTax],
  );

  const euRegion = useMemo(
    () => deriveEuRegion(regions, vatCollectionProcess, vatCollectionList),
    [regions, vatCollectionProcess, vatCollectionList],
  );

  useEffect(() => {
    const regionList = (taxSettingsData as TaxSettingsFormData)?.tax_regions;
    if (!Array.isArray(regionList)) {
      return;
    }

    setRegions(regionList);
    const eu = regionList.find((region) => region.code === 'EU');
    form.reset({
      type: eu?.type ? String(eu.type) : 'oss',
      product_tax: eu?.product_tax ?? [],
    });
  }, [taxSettingsData, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const buildUpdatedRegions = (
    values: TaxRegionEuFormInput,
    overrides?: Partial<TaxRegion>,
  ): TaxRegion[] => applyEuRegionUpdate(regions, values, overrides);

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
    const updatedRules = applyRegionRules(regions, 'EU', rulesList);
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

              <Card cssOverride={cardStyles.formCard} >
                <CardContent>
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
  },
});
