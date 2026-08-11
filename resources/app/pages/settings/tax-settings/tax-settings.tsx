import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { TaxIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsPageActions } from '@/pages/settings/settings-layout/use-settings-page-actions';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import TaxProfile from '@/pages/settings/tax-settings/tax-profile/tax-profile';
import TaxRegions from '@/pages/settings/tax-settings/tax-region/tax-region';
import type { TaxRegion } from '@/pages/settings/tax-settings/utils';
import { setUnsavedDataStatus } from '@/pages/settings/utils';
import {
  type TaxSettingsFormInput,
  type TaxSettingsFormPayload,
  TaxSettingsFormSchema,
} from '@/schemas/forms/tax-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TaxCollectionOptions = () => {
  const isTaxInclusivePrice = useWatch<
    TaxSettingsFormInput,
    'is_tax_inclusive_price'
  >({
    name: 'is_tax_inclusive_price',
  });

  return (
    <div>
      <Separator cssOverride={styles.separator} />
      {isTaxInclusivePrice ? (
        <CheckboxField
          name="is_shipping_tax_enabled"
          label={__('Charge shipping tax', 'kirki-ecommerce')}
          description={__('Set charge for shipping tax', 'kirki-ecommerce')}
        />
      ) : (
        <CheckboxField
          name="is_enabled_taxed_price"
          label={__('Display prices inclusive tax', 'kirki-ecommerce')}
          infoText={__(
            'Tax value will be included inside the product price',
            'kirki-ecommerce',
          )}
        />
      )}
    </div>
  );
};

const TaxCollectionRadio = () => {
  const { control } = useFormContext<TaxSettingsFormInput>();

  const optionsArray = [
    {
      title: __(
        'Tax should be calculated & displayed in the checkout page',
        'kirki-ecommerce',
      ),
      value: 'not_inclusive',
    },
    {
      title: __(
        'Tax is already included in product price and shipping rate',
        'kirki-ecommerce',
      ),
      value: 'inclusive',
      disabled: true,
    },
  ];

  return (
    <Controller
      control={control}
      name="is_tax_inclusive_price"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <RadioGroup
            value={field.value ? 'inclusive' : 'not_inclusive'}
            onValueChange={(value) => field.onChange(value === 'inclusive')}
            aria-invalid={fieldState.invalid}
          >
            {optionsArray.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <RadioGroupItem
                  value={option.value}
                  id={`tax-collection-${option.value}`}
                  disabled={option.disabled ?? false}
                />
                <FieldLabel htmlFor={`tax-collection-${option.value}`}>
                  {option.title}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const TaxSettings = () => {
  const { data: taxSettings, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettings);

  const form = useForm<TaxSettingsFormInput, unknown, TaxSettingsFormPayload>({
    resolver: zodResolver(TaxSettingsFormSchema),
    defaultValues: getDefaults(TaxSettingsFormSchema),
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!taxSettings || !Object.keys(taxSettings).length) {
      return;
    }

    form.reset(
      pickFormValues(TaxSettingsFormSchema, taxSettings, {
        tax_regions: Array.isArray(taxSettings.tax_regions)
          ? (taxSettings.tax_regions as TaxRegion[])
          : [],
        tax_services: [],
        tax_ids: [],
      }),
    );
  }, [taxSettings, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveTaxSettings = async (
    payload: TaxSettingsFormPayload,
    updatedRegions?: TaxRegion[],
  ) => {
    const data: TaxSettingsFormPayload = {
      ...payload,
      tax_regions: (updatedRegions ?? payload.tax_regions) as TaxSettingsFormPayload['tax_regions'],
    };

    try {
      await saveSettings({ key: 'tax', data });
      form.reset(form.getValues());
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleDiscardData = () => {
    form.reset();
  };

  const handleSaveFromRegions = async (updatedRegions?: TaxRegion[]) => {
    await handleSaveTaxSettings(TaxSettingsFormSchema.parse(form.getValues()), updatedRegions);
  };

  useSettingsPageActions({
    isDirty,
    isSaving,
    onSave: form.handleSubmit((values) => handleSaveTaxSettings(values)),
    onDiscard: handleDiscardData,
  });

  return (
    <Container size="sm">
      {loaded ? (
        <Form {...form}>
          <Flex direction="column" gap={4}>
            <SettingsPageHeader
              icon={<TaxIcon />}
              title={__('Tax', 'kirki-ecommerce')}
            />
            <Card cssOverride={cardStyles.formCard} >
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Flex direction="column" gap={2}>
                    <Text weight="semibold" cssOverride={styles.taxCollectionHeader}>{__('How would you like to collect tax?', 'kirki-ecommerce')}</Text>
                    <Text color="secondary">{__(
                      'Configure how tax is displayed and how it appears on your product listings.',
                      'kirki-ecommerce',
                    )}</Text>
                  </Flex>
                  <Flex direction="column" gap={3}>
                    <TaxCollectionRadio />
                    {/* @TODO: will be handled in the future */}
                    {/* eslint-disable-next-line no-constant-binary-expression -- kept in place until the feature is enabled */}
                    {false && <TaxCollectionOptions />}
                  </Flex>
                </Flex>
              </CardContent>
            </Card>
            <TaxRegions handleSave={handleSaveFromRegions} />
            <TaxProfile />
          </Flex>
        </Form>
      ) : (
        <div>{__('Loading ...', 'kirki-ecommerce')}</div>
      )}
    </Container>
  );
};

TaxSettings.displayName = 'TaxSettings';

export default TaxSettings;

const styles = defineStyles({
  separator: {
    marginBottom: theme.spacing[3],
  },
  taxCollectionHeader: {
    gap: theme.spacing[2],
  },
});
