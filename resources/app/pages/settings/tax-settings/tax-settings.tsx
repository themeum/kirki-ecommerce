import type { CSSObject } from '@emotion/react';
import { useEffect } from 'react';
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useOutletContext } from 'react-router';

import CheckboxField from '@/components/form/checkbox-field';
import PageNavbar from '@/components/page-navbar';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Form } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TaxIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { useUnsavedStatus } from '@/libs/unsaved-store';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
;
import { cardStyles } from '@/theme/card-styles';
import { TaxSettingsFormSchema, taxSettingsDefaultValues, type TaxSettingsFormValues } from '@/schemas/forms/tax-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import type { SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';
import type { TaxRegion } from '@/pages/settings/tax-settings/utils';
import TaxProfile from '@/pages/settings/tax-settings/tax-profile/tax-profile';
import TaxRegions from '@/pages/settings/tax-settings/tax-region/tax-region';

type SettingsOutletContext = {
  confirmAction: (params: { action?: () => void }) => void;
};

const TaxCollectionOptions = () => {
  const isTaxInclusivePrice = useWatch<TaxSettingsFormValues>({
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
          description={__(
            'Tax value will be included inside the product price',
            'kirki-ecommerce',
          )}
        />
      )}
    </div>
  );
};

const TaxCollectionRadio = () => {
  const { control } = useFormContext<TaxSettingsFormValues>();

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
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext<SettingsOutletContext>();

  const hasUnsavedData = useUnsavedStatus();
  const { data: taxSettings, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } =
    useUpdateSettingsMutation();

  const loaded = !isLoading && Boolean(taxSettings);

  const form = useForm<TaxSettingsFormValues>({
    resolver: zodResolver(TaxSettingsFormSchema),
    defaultValues: taxSettingsDefaultValues,
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!taxSettings || !Object.keys(taxSettings).length) {
      return;
    }

    form.reset({
      ...taxSettingsDefaultValues,
      ...taxSettings,
      is_tax_inclusive_price: !!taxSettings.is_tax_inclusive_price,
      is_enabled_taxed_price: !!taxSettings.is_enabled_taxed_price,
      is_shipping_tax_enabled: !!taxSettings.is_shipping_tax_enabled,
      tax_regions: Array.isArray(taxSettings.tax_regions)
        ? (taxSettings.tax_regions as TaxRegion[])
        : [],
      tax_services: [],
      tax_ids: [],
    });
  }, [taxSettings, form]);

  useEffect(() => {
    setUnsavedDataStatus(isDirty);
  }, [isDirty]);

  const handleSaveTaxSettings = async (
    values: TaxSettingsFormValues,
    updatedRegions?: TaxRegion[],
  ) => {
    const data = {
      ...values,
      tax_regions: (updatedRegions ?? values.tax_regions ?? []) as TaxSettingsFormValues['tax_regions'],
      tax_services: [],
      tax_ids: [],
    } as TaxSettingsFormValues;

    try {
      await saveSettings({ key: 'tax', data: data as SettingsSectionData });
      form.reset(data);
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
        action: () => navigate('/settings'),
      });
      return;
    }
    navigate('/settings');
  };

  const handleSaveFromRegions = async (updatedRegions?: TaxRegion[]) => {
    await handleSaveTaxSettings(form.getValues(), updatedRegions);
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
                variant="ghost"
                onClick={handleDiscardData}
                disabled={isSaving}
              >
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit((values) =>
                  handleSaveTaxSettings(values),
                )}
                loading={isSaving}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <PageNavbar
                textIcon={<TaxIcon />}
                text={'Tax'}
                handleBack={handleBackButton}
              />
              <Card cssOverride={cardStyles.largeCard} >
                <CardContent cssOverride={cardStyles.largeContentPadded}>

                <Flex direction="column" gap={2}>
                  <Text weight="semibold" cssOverride={styles.taxCollectionHeader}>{__('How would you like to collect tax?', 'kirki-ecommerce')}</Text>
                  <Text color="secondary">{__(
                'Configure how tax is displayed and how it appears on your product listings.',
                'kirki-ecommerce',
                )}</Text>
                </Flex>
                <Flex direction="column" gap={3}>
                <TaxCollectionRadio />
                <TaxCollectionOptions />
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
    </>
  );
};

TaxSettings.displayName = 'TaxSettings';

export default TaxSettings;

const styles = {
  separator: ({
    marginBottom: theme.spacing[3],
  } satisfies CSSObject),
  taxCollectionHeader: ({
    gap: theme.spacing[2],
  } satisfies CSSObject)
};
