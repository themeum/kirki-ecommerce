import { useEffect, useMemo, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import PageNavbar from '@/components/page-navbar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { queryKeys } from '@/libs/query-keys';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { RadioGroup } from '@/molecules/radio-group';
import Text from '@/molecules/text';
import {
  TaxRegionEuFormSchema,
  taxRegionEuDefaultValues,
  type TaxRegionEuFormValues,
} from '@/schemas/forms/tax-region-eu-form';
import { toastMutationError } from '@/services/helpers';
import {
  updateSettings,
  useSettingsQuery,
  useUpdateSettingsMutation,
} from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import type { TaxRate, TaxRegion, TaxRule } from '@/pages/settings/tax-settings/utils';
import TaxRules from '@/pages/settings/tax-settings/tax-region/tax-rules/tax-rules';
import { VatCollection } from '@/pages/settings/tax-settings/tax-region/vat-collection/vat-collection';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

type TaxSettingsFormData = Omit<SettingsSectionData, 'tax_regions'> & {
  tax_regions?: TaxRegion[];
};

const VatCollectionProcessRadios = () => {
  const { control, setValue, getValues } =
    useFormContext<TaxRegionEuFormValues>();

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
    <Flex direction={'column'} gap={8}>
      <Card
        type="inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--decom-spacing-2)',
        }}
      >
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  optionsArray={[
                    {
                      title: __('One Stop Shop (OSS)', 'kirki-ecommerce'),
                      value: 'oss',
                    },
                  ]}
                  value={field.value}
                  onChange={(value) => handleProcessChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <VatProcessDescription processValue="oss" />
      </Card>

      <Card
        type="inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--decom-spacing-2)',
        }}
      >
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  optionsArray={[
                    {
                      title: __('Micro Business', 'kirki-ecommerce'),
                      value: 'micro_business',
                    },
                  ]}
                  value={field.value}
                  onChange={(value) => handleProcessChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <VatProcessDescription processValue="micro_business" />
      </Card>
    </Flex>
  );
};

const VatProcessDescription = ({
  processValue,
}: {
  processValue: string;
}) => {
  const currentProcess = useWatch<TaxRegionEuFormValues>({ name: 'type' });

  if (currentProcess !== processValue) {
    return null;
  }

  return (
    <Card type="innerDark">
      <Text
        subHeader={
          processValue === 'oss'
            ? __(
                'Applies to businesses selling across multiple EU countries under OSS.',
                'kirki-ecommerce',
              )
            : __(
                'Applies to businesses with less than €10,000 EU sales.',
                'kirki-ecommerce',
              )
        }
      />
    </Card>
  );
};

const EditRegionEU = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const [regions, setRegions] = useState<TaxRegion[]>([]);

  const hasUnsavedData = useUnsavedStatus();
  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(taxSettingsData);

  const form = useForm<TaxRegionEuFormValues>({
    resolver: zodResolver(TaxRegionEuFormSchema),
    defaultValues: taxRegionEuDefaultValues,
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
    values: TaxRegionEuFormValues,
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
    const payload: TaxSettingsFormData = {
      ...(taxSettingsData as TaxSettingsFormData),
      tax_regions: taxRegions,
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

  const handleBackButton = () => {
    if (isDirty) {
      confirmAction({
        action: () => navigate('/settings/tax'),
      });
      return;
    }
    navigate('/settings/tax');
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
                state={isSaving ? 'disabled' : undefined}
              />
              <Button
                type="primary"
                size="small"
                text={__('Save', 'kirki-ecommerce')}
                onClick={form.handleSubmit(() => handleSaveData())}
                state={isSaving ? 'loading' : undefined}
              />
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
                text={__('EU', 'kirki-ecommerce')}
                textIcon={'🇪🇺'}
                handleBack={handleBackButton}
              />

              <Card type="large">
                <Text
                  type="primary"
                  header={__('How would you like to collect VAT?', 'kirki-ecommerce')}
                />
                <VatCollectionProcessRadios />
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
