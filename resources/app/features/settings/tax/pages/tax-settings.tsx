import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import Text from '@/components/ui/text';
import { useSettingsPageActions } from '@/features/settings/hooks/use-settings-page-actions';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import TaxCollectionField from '@/features/settings/tax/components/fields/tax-collection-field';
import type { TaxRegion } from '@/features/settings/tax/lib/utils';
import TaxProfile from '@/features/settings/tax/pages/tax-profile/tax-profile';
import TaxRegions from '@/features/settings/tax/pages/tax-region/tax-region';
import {
  type TaxSettingsFormInput,
  type TaxSettingsFormPayload,
  TaxSettingsFormSchema,
} from '@/features/settings/tax/schemas/forms/tax-settings-form';
import TaxSettingsSkeleton from '@/features/settings/tax/skeletons/tax-settings-skeleton';
import { TaxIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TaxCollectionOptions = () => {
  const isTaxInclusivePrice = useWatch<TaxSettingsFormInput, 'is_tax_inclusive_price'>({
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
          infoText={__('Tax value will be included inside the product price', 'kirki-ecommerce')}
        />
      )}
    </div>
  );
};

const TaxSettings = () => {
  const { data: taxSettings, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'tax'>();

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
        tax_regions: Array.isArray(taxSettings.tax_regions) ? taxSettings.tax_regions : [],
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
      tax_regions: updatedRegions ?? payload.tax_regions,
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
            <SettingsPageHeader icon={<TaxIcon />} title={__('Tax', 'kirki-ecommerce')} />
            <Card cssOverride={cardStyles.formCard}>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Flex direction="column" gap={2}>
                    <Text weight="semibold" cssOverride={styles.taxCollectionHeader}>
                      {__('How would you like to collect tax?', 'kirki-ecommerce')}
                    </Text>
                    <Text color="secondary">
                      {__(
                        'Configure how tax is displayed and how it appears on your product listings.',
                        'kirki-ecommerce',
                      )}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap={3}>
                    <TaxCollectionField />
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
        <TaxSettingsSkeleton />
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
